import { dbConnection } from "../config/db.js";
import type {
  createWorkflowsBody,
  KPIFormData,
  SystemUsage,
  WorkflowFormData,
  WorkflowRole,
  WorkflowStep,
} from "../interfaces/workflows.js";

export const createWorkflows = async (data: createWorkflowsBody) => {
  // 1️⃣ สร้างรหัส doc_id
  const [rows] = await dbConnection.query(
    `
    SELECT 
        d.department_code,
        DATE_FORMAT(NOW(), '%Y') AS year,
        DATE_FORMAT(NOW(), '%m') AS month,
        LPAD(COUNT(w.id) + 1, 3, '0') AS sequence
    FROM department d
    LEFT JOIN workflows w ON w.department_id = d.id
    WHERE d.id = ?
    GROUP BY d.id
   
    `,
    [data.department_id]
  );

  if ((rows as any).length === 0) throw new Error("Department not found");

  const row = (rows as any)[0];
  const docId = `${row.department_code}-${row.year}-${row.month}-${row.sequence}`;

  // 2️⃣ INSERT พร้อมใช้ doc_id ที่ได้
  const [insertResult] = await dbConnection.query(
    `
    INSERT INTO workflows (name, department_id, created_at,updated_at, doc_id,step,created_by,updated_by)
    VALUES (?, ?, NOW(), NOW(), ?,0,?,?)
    `,
    [data.name, data.department_id, docId, data?.created_by, data?.created_by]
  );
  const workflowId = (insertResult as any).insertId;
  await addRelatedDepartments(data.related_departments, workflowId);
  // คืนค่า insertId หรือ docId ก็ได้
  return { id: workflowId, docId };
};

export const getWorkflowsById = async (id: number) => {
  const [rows]: any[] = await dbConnection.query(
    `
    WITH
    -- CTE สำหรับ related_departments
    related_depts AS (
      SELECT
        workflow_id,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'department_id', department_id,
            'team_id', team_id
          )
        ) AS data
      FROM workflow_departments
      WHERE workflow_id = ?
      GROUP BY workflow_id
    ),
    -- CTE สำหรับ roles
    workflow_roles_agg AS (
      SELECT
        workflow_id,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'position', CONCAT(position),
            'responsibility', responsibility,
            'name', name,
            'uid', uid
          )
        ) AS data
      FROM workflow_roles
      WHERE workflow_id = ?
      GROUP BY workflow_id
    ),
    -- CTE สำหรับ KPIs
    workflow_kpis_agg AS (
      SELECT
        workflow_id,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'name', name,
            'target', target,
            'unit', unit
          )
        ) AS data
      FROM workflow_kpis
      WHERE workflow_id = ?
      GROUP BY workflow_id
    ),
    -- CTE สำหรับ system links (รวม links ของแต่ละ system ก่อน)
    system_links_agg AS (
      SELECT
        step_id,
        system_id,
        \`index\`,
        JSON_ARRAYAGG(link) AS links
      FROM workflow_system_links
      WHERE workflow_id = ?
      GROUP BY step_id, system_id, \`index\`
    ),
    -- CTE สำหรับ systems (ใช้ LEFT JOIN กับ links ที่ aggregate แล้ว)
    systems_agg AS (
      SELECT
        sys.step_id,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', sys.system_id,
            'usage_detail', sys.usage_detail,
            'system_name', sys.system_name,
            'links', COALESCE(sl.links, JSON_ARRAY())
          )
        ) AS data
      FROM workflow_systems sys
      LEFT JOIN system_links_agg sl
        ON sl.step_id = sys.step_id
        AND sl.system_id = sys.system_id
        AND sl.\`index\` = sys.id
      WHERE sys.workflow_id = ?
      GROUP BY sys.step_id
    ),
    -- CTE สำหรับ conditions
    conditions_agg AS (
      SELECT
        step_id,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'detail', detail,
            'next_step', next_step
          )
        ) AS data
      FROM workflow_conditions
      WHERE workflow_id = ?
      GROUP BY step_id
    ),
    -- CTE สำหรับ next_steps
    next_steps_agg AS (
      SELECT
        step_id,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'next_step', next_step
          )
        ) AS data
      FROM workflow_next_steps
      WHERE workflow_id = ?
      GROUP BY step_id
    ),
    -- CTE สำหรับ executors
    executors_agg AS (
      SELECT
        step_id,
        JSON_ARRAYAGG(CAST(position_id AS CHAR)) AS data
      FROM workflow_step_participants
      WHERE workflow_id = ?
        AND role = 'E'
        AND position_id IS NOT NULL
      GROUP BY step_id
    ),
    -- CTE สำหรับ receivers
    receivers_agg AS (
      SELECT
        step_id,
        JSON_ARRAYAGG(CAST(position_id AS CHAR)) AS data
      FROM workflow_step_participants
      WHERE workflow_id = ?
        AND role = 'R'
        AND position_id IS NOT NULL
      GROUP BY step_id
    ),
    -- CTE สำหรับ steps (รวมข้อมูลย่อยทั้งหมดด้วย LEFT JOIN)
    steps_agg AS (
      SELECT
        ws.workflow_id,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', ws.id,
            'step_name', ws.step_name,
            'input_trigger', ws.input_trigger,
            'output_result', ws.output_result,
            'description', ws.description,
            'duration_value', ws.duration_value,
            'duration_unit', ws.duration_unit,
            'condition', ws.is_condition,
            'next_step', ws.next_step,
            'issues', ws.issues,
            'suggestions', ws.suggestions,
            'systems', COALESCE(sys.data, JSON_ARRAY()),
            'conditions', COALESCE(cond.data, JSON_ARRAY()),
            'next_steps', COALESCE(ns.data, JSON_ARRAY()),
            'executors', COALESCE(exec.data, JSON_ARRAY()),
            'receivers', COALESCE(recv.data, JSON_ARRAY())
          )
        ) AS data
      FROM workflow_steps ws
      LEFT JOIN systems_agg sys ON sys.step_id = ws.id
      LEFT JOIN conditions_agg cond ON cond.step_id = ws.id
      LEFT JOIN next_steps_agg ns ON ns.step_id = ws.id
      LEFT JOIN executors_agg exec ON exec.step_id = ws.id
      LEFT JOIN receivers_agg recv ON recv.step_id = ws.id
      WHERE ws.workflow_id = ?
      GROUP BY ws.workflow_id
      ORDER BY ws.id
    )
    -- Main query
    SELECT
      w.name,
      w.start_date,
      COALESCE(rd.data, JSON_ARRAY()) AS related_departments,
      w.responsible_position_id,
      w.responsible_id,
      w.flow_type,
      w.iso_compliance,
      w.iso_procedure_id,
      w.objective,
      w.start_point,
      w.expected_result,
      w.created_at,
      w.step,
      COALESCE(wr.data, JSON_ARRAY()) AS roles,
      COALESCE(st.data, JSON_ARRAY()) AS steps,
      w.overall_duration_value,
      w.overall_duration_unit,
      w.duration_impact_factors,
      w.workflow_impact,
      w.doc_id,
      COALESCE(kp.data, JSON_ARRAY()) AS kpis,
      d.name AS department_name,
      d.department_code,
      w.updated_at,
      w.status,
      w.frequency,
      w.department_id
    FROM workflows w
    LEFT JOIN department d ON d.id = w.department_id
    LEFT JOIN related_depts rd ON rd.workflow_id = w.id
    LEFT JOIN workflow_roles_agg wr ON wr.workflow_id = w.id
    LEFT JOIN workflow_kpis_agg kp ON kp.workflow_id = w.id
    LEFT JOIN steps_agg st ON st.workflow_id = w.id
    WHERE w.id = ?;
`,
    [id, id, id, id, id, id, id, id, id, id, id]
  );

  return rows ? rows[0] : {}; // คืนค่า index 0 หรือ null ถ้าไม่มีข้อมูล
};

// ====== UPDATE MAIN WORKFLOW (TABLE: workflows) ======
export const updateWorkflowsById = async (
  data: WorkflowFormData,
  id: number
) => {
  const [rows]: any[] = await dbConnection.query(
    `UPDATE workflows
      SET name=?,
          start_date=?,
          flow_type=?,
          iso_compliance=?,
          iso_procedure_id=?,
          objective=?,
          start_point=?,
          expected_result=?,
          duration_impact_factors=?,
          workflow_impact=?,
          updated_at=current_timestamp(),
          responsible_position_id=?,
          responsible_id=?,
          overall_duration_value=?,
          overall_duration_unit=?,
          frequency=?,
          status=?,
          step=?,
          updated_by=?,
          updated_at = NOW()
      WHERE id=?`,
    [
      data.name,
      data.start_date,
      data.flow_type,
      data.iso_compliance,
      data.iso_procedure_id ?? null,
      data.objective,
      data.start_point,
      data.expected_result,
      data.duration_impact_factors,
      data.workflow_impact,
      data.responsible_position_id,
      data.responsible_id,
      data.overall_duration_value,
      data.overall_duration_unit,
      data.frequency,
      data.status ?? 1,
      data.step ?? 1,
      data.updated_by,
      id,
    ]
  );
  return rows ? rows[0] : {};
};

// ====== KPI (TABLE: workflow_kpis) ======
export const deleteKpi = async (workflowId: number) => {
  await dbConnection.query("DELETE FROM workflow_kpis WHERE workflow_id=?;", [
    workflowId,
  ]);
};

export const addKpi = async (data: KPIFormData[], workflowId: number) => {
  if (!Array.isArray(data) || data.length === 0) return;

  const values = data
    .filter((kpi) => kpi && kpi.name && kpi.target != null && kpi.unit != null)
    .map((kpi) => [workflowId, kpi.name, kpi.target, kpi.unit]);

  if (values.length === 0) return;

  await dbConnection.query(
    `INSERT INTO workflow_kpis (workflow_id, name, target, unit) VALUES ?`,
    [values]
  );
};

// ====== RELATED DEPARTMENTS (TABLE: workflow_departments) ======
export const deleteRelatedDepartments = async (workflowId: number) => {
  await dbConnection.query(
    "DELETE FROM workflow_departments WHERE workflow_id=?;",
    [workflowId]
  );
};

export const addRelatedDepartments = async (
  data: any[],
  workflowId: number
) => {
  if (!Array.isArray(data) || data.length === 0) return;

  const values = data
    .filter((dep) => dep && dep.department_id != null)
    .map((dep) => [workflowId, dep.department_id, dep.team_id ?? null]);

  if (values.length === 0) return;

  await dbConnection.query(
    `INSERT INTO workflow_departments (workflow_id, department_id, team_id) VALUES ?`,
    [values]
  );
};

// ====== ROLES (TABLE: workflow_roles) ======
export const deleteRoles = async (workflowId: number) => {
  await dbConnection.query("DELETE FROM workflow_roles WHERE workflow_id=?", [
    workflowId,
  ]);
};

export const addRoles = async (data: WorkflowRole[], workflowId: number) => {
  if (!Array.isArray(data) || data.length === 0) return;

  const values = data
    .filter((role) => {
      if (!role || Object.keys(role).length === 0) return false; // ข้าม null หรือ {}

      // ถ้า position != 0 ต้องมี position และ responsibility
      return role.position != null && role.responsibility != null;
    })
    .map((role) => [
      workflowId,
      role.position,
      role.responsibility,
      role.name,
      role.uid,
    ]);

  if (values.length === 0) return; // ไม่มีค่าที่จะ insert

  await dbConnection.query(
    `INSERT INTO workflow_roles (workflow_id, position, responsibility, name, uid) VALUES ?`,
    [values]
  );
};

// ====== SYSTEMS (TABLE: workflow_systems, workflow_system_links) ======
export const addWorkflowSystems = async (
  data: SystemUsage[],
  workflowId: number,
  stepId: number
) => {
  if (!Array.isArray(data) || data.length === 0) return;

  for (const system of data) {
    if (!system || Object.keys(system).length === 0) continue; // ✅ ข้าม object ว่าง

    const systemId = system.id;

    // insert workflow_systems
    const [result] = await dbConnection.query(
      `INSERT INTO workflow_systems (workflow_id, step_id, system_id, usage_detail, system_name)
       VALUES (?, ?, ?, ?, ?)`,
      [workflowId, stepId, systemId, system.usage_detail, system.system_name]
    );

    // ดึง id ที่เพิ่ง insert มา
    const workflowSystemId = (result as any).insertId;

    // insert links safely
    const links = Array.isArray(system.links) ? system.links : [];
    for (const link of links) {
      if (!link) continue; // ✅ ข้าม null/empty
      await dbConnection.query(
        `INSERT IGNORE INTO workflow_system_links (workflow_id, step_id, system_id, link, \`index\`)
         VALUES (?, ?, ?, ?, ?)`,
        [workflowId, stepId, systemId, link, workflowSystemId]
      );
    }
  }
};

// ====== STEPS (TABLE: workflow_steps, workflow_conditions) ======
export const deleteSteps = async (workflowId: number) => {
  await dbConnection.query("DELETE FROM workflow_steps WHERE workflow_id=?", [
    workflowId,
  ]);
  await dbConnection.query(
    "DELETE FROM workflow_conditions WHERE workflow_id=?",
    [workflowId]
  );
  await dbConnection.query(
    "DELETE FROM workflow_next_steps WHERE workflow_id=?",
    [workflowId]
  );
  await dbConnection.query("DELETE FROM workflow_systems WHERE workflow_id=?", [
    workflowId,
  ]);
  await dbConnection.query(
    "DELETE FROM workflow_system_links WHERE workflow_id=?",
    [workflowId]
  );
  await dbConnection.query(
    "DELETE FROM workflow_step_participants WHERE workflow_id=?",
    [workflowId]
  );
};

export const addSteps = async (data: WorkflowStep[], workflowId: number) => {
  if (!Array.isArray(data) || data.length === 0) return;

  const stepIdMap: Record<number, number> = {};

  for (const step of data) {
    if (!step || Object.keys(step).length === 0) continue; // ✅ ข้าม object ว่าง

    const [result]: any = await dbConnection.query(
      `INSERT INTO workflow_steps 
      (workflow_id, step_name, is_condition, input_trigger, output_result,
       duration_value, duration_unit, issues, suggestions, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        workflowId,
        step.step_name,
        step.condition ? 1 : 0,
        step.input_trigger ?? null,
        step.output_result ?? null,
        step.duration_value ?? null,
        step.duration_unit ?? null,
        step.issues ?? null,
        step.suggestions ?? null,
        step.description ?? null,
      ]
    );

    const newStepId = result.insertId;
    stepIdMap[step?.id] = newStepId;

    // insert systems ของ step
    if (Array.isArray(step?.systems) && step.systems.length > 0) {
      await addWorkflowSystems(step.systems, workflowId, newStepId);
    }

    // 🔹 insert participants (executors)
    if (Array.isArray(step?.executors) && step.executors.length > 0) {
      for (const employeeId of step.executors) {
        if (!employeeId) continue; // ✅ ข้าม null/undefined
        await dbConnection.query(
          `INSERT INTO workflow_step_participants
           (step_id, workflow_id, position_id, role)
           VALUES (?, ?, ?, ?)`,
          [newStepId, workflowId, employeeId, "E"]
        );
      }
    }

    // 🔹 insert participants (receivers)
    if (Array.isArray(step?.receivers) && step.receivers.length > 0) {
      for (const employeeId of step.receivers) {
        if (!employeeId) continue;
        await dbConnection.query(
          `INSERT INTO workflow_step_participants
           (step_id, workflow_id, position_id, role)
           VALUES (?, ?, ?, ?)`,
          [newStepId, workflowId, employeeId, "R"]
        );
      }
    }
  }

  // insert conditions
  for (const step of data) {
    if (!step || Object.keys(step).length === 0) continue;
    const newStepId = stepIdMap[step?.id];

    if (Array.isArray(step?.conditions) && step.conditions.length > 0) {
      for (const c of step.conditions) {
        if (!c || Object.keys(c).length === 0) continue;
        const mappedNextStepId =
          c.next_step != null ? stepIdMap[c?.next_step] ?? null : null;

        await dbConnection.query(
          `INSERT INTO workflow_conditions (workflow_id, step_id, detail, next_step)
           VALUES (?, ?, ?, ?)`,
          [workflowId, newStepId, c.detail, mappedNextStepId ?? "last"]
        );
      }
    }
    if (Array.isArray(step?.next_steps) && step.next_steps.length > 0) {
      for (const c of step.next_steps) {
        if (!c || Object.keys(c).length === 0) continue;
        const mappedNextStepId =
          c.next_step != null ? stepIdMap[c?.next_step] ?? null : null;

        await dbConnection.query(
          `INSERT INTO workflow_next_steps (workflow_id, step_id, next_step)
           VALUES (?, ?,  ?)`,
          [workflowId, newStepId, mappedNextStepId ?? "last"]
        );
      }
    }
  }
};

// ====== MAIN WRAPPER FUNCTION (UPDATE WORKFLOW) ======
export const updateWorkflow = async (
  workflowId: number,
  data: WorkflowFormData
) => {
  await updateWorkflowsById(data, workflowId);

  await deleteSteps(workflowId);
  await deleteKpi(workflowId);
  await deleteRoles(workflowId);
  await deleteRelatedDepartments(workflowId);

  await addKpi(data.kpis, workflowId);

  await addRelatedDepartments(data.related_departments, workflowId);

  await addRoles(data.roles, workflowId);

  await addSteps(data.steps, workflowId);

  return { success: true };
};
export const getListWorkflow = async (body: any) => {
  let query = `
    SELECT 
      w.id, w.name, w.doc_id, d.name AS department_name, 
      w.status, w.updated_at, w.overall_duration_unit, w.overall_duration_value,
      CONCAT(e.name_th) AS updated_by_name,
      dt.name AS team_name,
      case w.flow_type when 'M' then 'Main flow'
      	when 'S' then 'Sub flow'
      	else null end AS flow_type
    FROM workflows w 
    LEFT JOIN department d ON d.id = w.department_id
    LEFT JOIN employee e ON w.updated_by = e.id
    LEFT JOIN employee r ON w.responsible_id = r.id
    LEFT JOIN \`position\` p ON p.id = w.responsible_position_id 
    LEFT JOIN department_team dt ON dt.id = p.team_id
    WHERE w.is_delete = 0
  `;

  const params: any[] = [];

  // ฟังก์ชันช่วย normalize ให้เป็น array เสมอ
  const normalizeArray = (value: any) =>
    value === undefined || value === null
      ? []
      : Array.isArray(value)
      ? value
      : [value];

  // Filters
  if (body?.status) {
    query += ` AND w.status = ? \n`;
    params.push(body.status);
  }

  if (body?.name) {
    query += ` AND w.name LIKE ? \n`;
    params.push(`%${body.name}%`);
  }
  if (body?.flow_type) {
    query += ` AND w.flow_type = ? \n`;
    params.push(body.flow_type);
  }
  const departmentIds = normalizeArray(body?.department_id);
  if (departmentIds.length > 0) {
    const placeholders = departmentIds.map(() => "?").join(",");
    query += ` AND w.department_id IN (${placeholders}) \n`;
    params.push(...departmentIds);
  }

  const responsibleIds = normalizeArray(body?.responsible_id);
  if (responsibleIds.length > 0) {
    const placeholders = responsibleIds.map(() => "?").join(",");
    query += ` AND r.id IN (${placeholders}) \n`;
    params.push(...responsibleIds);
  }

  const teamIds = normalizeArray(body?.team_id);
  if (teamIds.length > 0) {
    const placeholders = teamIds.map(() => "?").join(",");
    query += ` AND p.team_id IN (${placeholders}) \n`;
    params.push(...teamIds);
  }

  // Sorting
  const sortBy = body?.sort_by || "updated_at";
  const sortDirection =
    body?.sort_direction?.toUpperCase() === "ASC" ? "ASC" : "DESC";
  query += ` ORDER BY w.${sortBy} ${sortDirection} \n`;

  // Pagination
  if (body?.page && body?.per_page) {
    query += ` LIMIT ? OFFSET ? \n`;
    params.push(body.per_page, (body.page - 1) * body.per_page);
  }

  query += ";";

  const [rows]: any[] = await dbConnection.query(query, params);
  return rows;
};

export const countListWorkflow = async (body: any) => {
  let query = `
    SELECT COUNT(*) AS total
    FROM workflows w 
    LEFT JOIN department d ON d.id = w.department_id
    LEFT JOIN employee e ON w.updated_by = e.id
    LEFT JOIN employee r ON w.responsible_id = r.id
    LEFT JOIN \`position\` p ON p.id = w.responsible_position_id
    LEFT JOIN department_team dt ON dt.id = p.team_id
    WHERE w.is_delete = 0
  `;

  const params: any[] = [];
  const normalizeArray = (value: any) =>
    value === undefined || value === null
      ? []
      : Array.isArray(value)
      ? value
      : [value];

  // Filters
  if (body?.status) {
    query += ` AND w.status = ? \n`;
    params.push(body.status);
  }
  if (body?.flow_type) {
    query += ` AND w.flow_type = ? \n`;
    params.push(body.flow_type);
  }
  if (body?.name) {
    query += ` AND w.name LIKE ? \n`;
    params.push(`%${body.name}%`);
  }

  const departmentIds = normalizeArray(body?.department_id);
  if (departmentIds.length > 0) {
    const placeholders = departmentIds.map(() => "?").join(",");
    query += ` AND w.department_id IN (${placeholders}) \n`;
    params.push(...departmentIds);
  }

  const responsibleIds = normalizeArray(body?.responsible_id);
  if (responsibleIds.length > 0) {
    const placeholders = responsibleIds.map(() => "?").join(",");
    query += ` AND r.id IN (${placeholders}) \n`;
    params.push(...responsibleIds);
  }

  const teamIds = normalizeArray(body?.team_id);
  if (teamIds.length > 0) {
    const placeholders = teamIds.map(() => "?").join(",");
    query += ` AND p.team_id IN (${placeholders}) \n`;
    params.push(...teamIds);
  }

  query += ";";

  const [rows]: any[] = await dbConnection.query(query, params);
  return rows ? rows[0] : { total: 0 };
};

export const updateWorkflowsStatusById = async (
  data: WorkflowFormData,
  id: number
) => {
  const [rows]: any[] = await dbConnection.query(
    `UPDATE workflows
      SET  status=?
      WHERE id=?`,
    [data.status ?? 1, id]
  );
  return { success: true };
};
export const createWorkflowsImport = async (
  dataList: WorkflowFormData[],
  createdBy: number
) => {
  const results: { id: number; docId: string }[] = [];

  for (const data of dataList) {
    // 1️⃣ ดึงข้อมูล department + sequence
    const [rows] = await dbConnection.query(
      `SELECT
        d.department_code,
        DATE_FORMAT(NOW(), '%Y') AS year,
        DATE_FORMAT(NOW(), '%m') AS month,
        LPAD(COUNT(w.id) + 1, 3, '0') AS sequence
       FROM department d
       LEFT JOIN workflows w ON w.department_id = d.id
       WHERE d.id = ?
       GROUP BY d.id`,
      [data.department_id]
    );

    if ((rows as any).length === 0) throw new Error("Department not found");

    const row = (rows as any)[0];
    const docId = `${row.department_code}-${row.year}-${row.month}-${row.sequence}`;

    // 🔧 แก้ไขปัญหา: ลบ column ที่ซ้ำ และจัดจำนวน placeholder ให้ตรง
    const [insertResult] = await dbConnection.query(
      `INSERT INTO workflows (
        created_at,
        updated_at,
        step,
        name,
        department_id,
        doc_id,
        iso_compliance,
        iso_procedure_id,
        responsible_id,
        responsible_position_id,
        objective,
        frequency,
        flow_type,
        workflow_impact,
        created_by,
        updated_by,
        status
      )
      VALUES (
        NOW(),
        NOW(),
        0,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        1
      )`,
      [
        data.name, // 1
        data.department_id, // 2
        docId, // 3
        data.iso_compliance, // 4
        data.iso_procedure_id, // 5
        data.responsible_id, // 6
        data.responsible_position_id, // 7
        data.objective, // 8
        data.frequency, // 9
        data.flow_type, // 10
        data.workflow_impact, // 11
        createdBy, // 12
        createdBy, // 12
      ]
    );

    // เพิ่ม related departments
    await addRelatedDepartments(
      data?.related_departments,
      (insertResult as any).insertId
    );

    results.push({
      id: (insertResult as any).insertId,
      docId,
    });
  }

  return results;
};
export const deleteWorkflow = async (workflowId: number) => {
  await dbConnection.query("UPDATE  workflows SET is_delete = 1  WHERE id=?;", [
    workflowId,
  ]);

  await deleteSteps(workflowId);
  await deleteKpi(workflowId);
  await deleteRoles(workflowId);
  await deleteRelatedDepartments(workflowId);
};
export const duplicateWorkflow = async (body: any) => {
  const [rows]: any[] = await dbConnection.query(
    `SELECT w.department_id
    FROM workflows w
    WHERE w.id = ?;`,
    [body?.workflows_id]
  );

  const [rowsDepartment] = await dbConnection.query(
    ` SELECT 
        d.department_code,
        DATE_FORMAT(NOW(), '%Y') AS year,
        DATE_FORMAT(NOW(), '%m') AS month,
        LPAD(COUNT(w.id) + 1, 3, '0') AS sequence
    FROM department d
    LEFT JOIN workflows w ON w.department_id = d.id
    WHERE d.id = ?
    GROUP BY d.id
   
    `,
    [rows[0].department_id]
  );

  if ((rowsDepartment as any).length === 0)
    throw new Error("Department not found");

  const row = (rowsDepartment as any)[0];
  const docId = `${row.department_code}-${row.year}-${row.month}-${row.sequence}`;

  const [rowsInsert]: any[] = await dbConnection.query(
    `INSERT INTO workflows (
    name, doc_id, start_date,
    flow_type, iso_compliance, iso_procedure_id, 
    objective, start_point, expected_result,
    duration_impact_factors, workflow_impact, 
    department_id, step, responsible_position_id, 
    responsible_id, overall_duration_value,
    overall_duration_unit, status,frequency,
    created_by, updated_by, created_at, updated_at)
    SELECT 
      name, ?, start_date,
      flow_type, iso_compliance, iso_procedure_id, 
      objective, start_point, expected_result,
      duration_impact_factors, workflow_impact, 
      department_id, 0, responsible_position_id, 
      responsible_id, overall_duration_value,
      overall_duration_unit, 1,frequency,
      ?, ?, CURRENT_TIME(), CURRENT_TIME()
    FROM workflows
    WHERE id = ?;`,
    [docId, body?.created_by, body?.created_by, body?.workflows_id]
  );
  const workflowsId = (rowsInsert as any).insertId;

  const [workflowDepartments]: any[] = await dbConnection.query(
    `INSERT INTO workflow_departments (
      workflow_id, department_id, team_id)
    SELECT  ?, department_id, team_id
    FROM workflow_departments
    WHERE workflow_id = ?;`,
    [workflowsId, body?.workflows_id]
  );
  const [workflowKPI]: any[] = await dbConnection.query(
    `INSERT INTO workflow_kpis
    ( workflow_id, name, target, unit)
    SELECT  ?, name, target, unit
    FROM workflow_kpis
    WHERE workflow_id = ?;`,
    [workflowsId, body?.workflows_id]
  );
  const [workflowPosition]: any[] = await dbConnection.query(
    `INSERT INTO workflow_positions
    (workflow_id, position_id)
    SELECT  ?, position_id
    FROM workflow_positions
    WHERE workflow_id = ?;`,
    [workflowsId, body?.workflows_id]
  );
  const [workflowRole]: any[] = await dbConnection.query(
    `INSERT INTO workflow_roles
    ( workflow_id, name, position, responsibility)
    SELECT  ?, name, position, responsibility
    FROM workflow_roles
    WHERE workflow_id = ?;`,
    [workflowsId, body?.workflows_id]
  );
  const [WorkflowStep]: any[] = await dbConnection.query(
    `INSERT INTO workflow_steps
    (is_condition, step_name, input_trigger,
    output_result, duration_value, duration_unit, workflow_id, issues, suggestions, description)  
    SELECT  is_condition, step_name, input_trigger,
    output_result, duration_value, duration_unit, ?, issues, suggestions, description
    FROM workflow_steps
    WHERE workflow_id = ?;`,
    [workflowsId, body?.workflows_id]
  );
  const [WorkflowSystemLinks]: any[] = await dbConnection.query(
    `INSERT INTO workflow_system_links
    (workflow_id, link, system_id, step_id)  
    SELECT  ?, link, system_id, step_id
    FROM workflow_system_links
    WHERE workflow_id = ?;`,
    [workflowsId, body?.workflows_id]
  );
  const [WorkflowStepParticipants]: any[] = await dbConnection.query(
    `INSERT INTO workflow_step_participants
    (step_id, workflow_id, position_id, role)  
    SELECT  step_id, ?, position_id, role
    FROM workflow_step_participants
    WHERE workflow_id = ?;`,
    [workflowsId, body?.workflows_id]
  );
  const [WorkflowSystem]: any[] = await dbConnection.query(
    `INSERT INTO workflow_systems
    (workflow_id, system_id, usage_detail, step_id)
    SELECT  ?, system_id, usage_detail, step_id
    FROM workflow_systems
    WHERE workflow_id = ?;`,
    [workflowsId, body?.workflows_id]
  );
  const [WorkflowStepCondition]: any[] = await dbConnection.query(
    `
  INSERT INTO workflow_conditions (step_id, detail, next_step, workflow_id)
  SELECT
    -- Map step_id เก่าเป็น step_id ใหม่ผ่าน step_name
    current_step_map.new_step_id AS step_id,
    wc.detail,
    -- Map next_step เก่าเป็น next_step ใหม่ผ่าน step_name
    -- ถ้าไม่เจอ (เช่น next_step = 'last') ให้ใช้ค่าเดิม
    COALESCE(next_step_map.new_step_id, wc.next_step) AS next_step,
    ? AS workflow_id
  FROM workflow_conditions wc

  -- Join เพื่อหา step_id ใหม่ของ current step
  LEFT JOIN (
    SELECT old_step.id AS old_step_id, new_step.id AS new_step_id
    FROM workflow_steps old_step
    INNER JOIN workflow_steps new_step ON old_step.step_name = new_step.step_name
    WHERE old_step.workflow_id = ? AND new_step.workflow_id = ?
  ) current_step_map ON wc.step_id = current_step_map.old_step_id

  -- Join เพื่อหา step_id ใหม่ของ next step (รองรับเฉพาะกรณีที่เป็น numeric)
  LEFT JOIN (
    SELECT old_step.id AS old_step_id, new_step.id AS new_step_id
    FROM workflow_steps old_step
    INNER JOIN workflow_steps new_step ON old_step.step_name = new_step.step_name
    WHERE old_step.workflow_id = ? AND new_step.workflow_id = ?
  ) next_step_map ON wc.next_step = next_step_map.old_step_id AND wc.next_step REGEXP '^[0-9]+$'

  WHERE wc.workflow_id = ?;
`,
    [
      workflowsId,
      body?.workflows_id,
      workflowsId,
      body?.workflows_id,
      workflowsId,
      body?.workflows_id,
    ]
  );
  const [WorkflowNextSteps]: any[] = await dbConnection.query(
    `
  INSERT INTO workflow_next_steps (step_id, next_step, workflow_id)
  SELECT
    -- Map step_id เก่าเป็น step_id ใหม่ผ่าน step_name
    current_step_map.new_step_id AS step_id,
    -- Map next_step เก่าเป็น next_step ใหม่ผ่าน step_name
    -- ถ้าไม่เจอ (เช่น next_step = 'last') ให้ใช้ค่าเดิม
    COALESCE(next_step_map.new_step_id, wns.next_step) AS next_step,
    ? AS workflow_id
  FROM workflow_next_steps wns

  -- Join เพื่อหา step_id ใหม่ของ current step
  LEFT JOIN (
    SELECT old_step.id AS old_step_id, new_step.id AS new_step_id
    FROM workflow_steps old_step
    INNER JOIN workflow_steps new_step ON old_step.step_name = new_step.step_name
    WHERE old_step.workflow_id = ? AND new_step.workflow_id = ?
  ) current_step_map ON wns.step_id = current_step_map.old_step_id

  -- Join เพื่อหา step_id ใหม่ของ next step (รองรับเฉพาะกรณีที่เป็น numeric)
  LEFT JOIN (
    SELECT old_step.id AS old_step_id, new_step.id AS new_step_id
    FROM workflow_steps old_step
    INNER JOIN workflow_steps new_step ON old_step.step_name = new_step.step_name
    WHERE old_step.workflow_id = ? AND new_step.workflow_id = ?
  ) next_step_map ON wns.next_step = next_step_map.old_step_id AND wns.next_step REGEXP '^[0-9]+$'

  WHERE wns.workflow_id = ?;
`,
    [
      workflowsId,
      body?.workflows_id,
      workflowsId,
      body?.workflows_id,
      workflowsId,
      body?.workflows_id,
    ]
  );
  return { id: workflowsId, docId };
};

export const countDepartment = async () => {
  const [rows] = await dbConnection.query(`SELECT
      d.id,
      d.department_code,
      d.name,
      COUNT(CASE WHEN w.status = 1 THEN 1 END) AS draft,
      COUNT(CASE WHEN w.status = 1 AND w.flow_type = 'M' THEN 1 END) AS draft_main,
      COUNT(CASE WHEN w.status = 1 AND w.flow_type = 'S' THEN 1 END) AS draft_sub,
      COUNT(CASE WHEN w.status = 3 THEN 1 END) AS published,
      COUNT(CASE WHEN w.status = 3 AND w.flow_type = 'M' THEN 1 END) AS published_main,
      COUNT(CASE WHEN w.status = 3 AND w.flow_type = 'S' THEN 1 END) AS published_sub
    FROM department d
    LEFT JOIN workflows w ON w.department_id = d.id AND w.is_delete = 0
    WHERE d.status IS NOT NULL
    AND d.id != 1
    GROUP BY d.id, d.department_code, d.name
  ;`);
  return rows;
};
export const countTeam = async (body: WorkflowFormData) => {
  let query = `
SELECT
      dt.id,
      dt.name,
      COUNT(CASE WHEN w.status = 1 THEN 1 END) AS draft,
      COUNT(CASE WHEN w.status = 1 AND w.flow_type = 'M' THEN 1 END) AS draft_main,
      COUNT(CASE WHEN w.status = 1 AND w.flow_type = 'S' THEN 1 END) AS draft_sub,
      COUNT(CASE WHEN w.status = 3 THEN 1 END) AS published,
      COUNT(CASE WHEN w.status = 3 AND w.flow_type = 'M' THEN 1 END) AS published_main,
      COUNT(CASE WHEN w.status = 3 AND w.flow_type = 'S' THEN 1 END) AS published_sub
    FROM department_team dt
    LEFT JOIN ( SELECT w.flow_type, w.department_id ,p.team_id,w.status
	    FROM workflows w 
	    LEFT JOIN department d ON d.id = w.department_id
	    LEFT JOIN employee e ON w.updated_by = e.id
	    LEFT JOIN employee r ON w.responsible_id = r.id
	    LEFT JOIN position p ON p.id = w.responsible_position_id 
	    LEFT JOIN department_team dt ON dt.id = p.team_id
	    WHERE w.is_delete = 0) w on w.department_id = dt.department_id AND w.team_id = dt.id
    WHERE dt.status IS NOT NULL
  \n`;
  const params: any[] = [];

  if (body?.department_id) {
    query += ` AND dt.department_id = ? \n`;
    params.push(body.department_id);
  }

  query += ` GROUP BY dt.id, dt.name \n`;
  query += ";";
  console.log("🚀 ~ countTeam ~ query:", query);
  const [rows]: any[] = await dbConnection.query(query, params);

  return rows;
};
export const countTeamById = async (id: number) => {
  let query = `
    SELECT
      d.id,
      d.department_code,
      d.name,
      COUNT(CASE WHEN w.status = 1 THEN 1 END) AS draft,
      COUNT(CASE WHEN w.status = 1 AND w.flow_type = 'M' THEN 1 END) AS draft_main,
      COUNT(CASE WHEN w.status = 1 AND w.flow_type = 'S' THEN 1 END) AS draft_sub,
      COUNT(CASE WHEN w.status = 3 THEN 1 END) AS published,
      COUNT(CASE WHEN w.status = 3 AND w.flow_type = 'M' THEN 1 END) AS published_main,
      COUNT(CASE WHEN w.status = 3 AND w.flow_type = 'S' THEN 1 END) AS published_sub
    FROM department d
    LEFT JOIN workflows w ON w.department_id = d.id AND w.is_delete = 0
    WHERE d.status IS NOT NULL
    
  \n`;
  const params: any[] = [];

  if (id) {
    query += ` AND d.id = ? \n`;
    params.push(id);
  }
  query += `GROUP BY d.id, d.department_code, d.name \n`;
  query += ";";
  const [rows]: any[] = await dbConnection.query(query, params);

  return rows ? rows[0] : {}; // คืนค่า index 0 หรือ null ถ้าไม่มีข้อมูล
};
export const getWorkflowReportData = async (body: any) => {
  const normalizeArray = (value: any) =>
    value === undefined || value === null ? [] : Array.isArray(value) ? value : [value];

  // Step 1: ดึง workflow list ก่อน
  const wlConditions: string[] = ["w.is_delete = 0"];
  const wlParams: any[] = [];

  if (body?.status) {
    wlConditions.push("w.status = ?");
    wlParams.push(body.status);
  }

  const departmentIds = normalizeArray(body?.department_id);
  if (departmentIds.length > 0) {
    wlConditions.push(`w.department_id IN (${departmentIds.map(() => "?").join(",")})`);
    wlParams.push(...departmentIds);
  }

  if (body?.flow_type) {
    wlConditions.push("w.flow_type = ?");
    wlParams.push(body.flow_type);
  }

  const [workflows]: any[] = await dbConnection.query(
    `SELECT
      w.id,
      w.name,
      w.doc_id,
      w.department_id,
      w.status,
      w.updated_at,
      w.created_at,
      w.overall_duration_unit,
      w.overall_duration_value,
      w.flow_type,
      w.updated_by,
      w.responsible_position_id,
      w.responsible_id,
      w.start_date,
      w.iso_compliance,
      w.iso_procedure_id,
      w.objective,
      w.start_point,
      w.expected_result,
      w.duration_impact_factors,
      w.workflow_impact,
      w.frequency,
      w.step,
      d.name AS department_name,
      d.department_code,
      CONCAT(e.name_th) AS updated_by_name,
      dt.name AS team_name,
      p.name AS responsible_position_name,
      CASE w.flow_type
        WHEN 'M' THEN 'Main flow'
        WHEN 'S' THEN 'Sub flow'
        ELSE NULL
      END AS flow_type_label
    FROM workflows w
    LEFT JOIN department d ON d.id = w.department_id
    LEFT JOIN employee e ON w.updated_by = e.id
    LEFT JOIN \`position\` p ON p.id = w.responsible_position_id
    LEFT JOIN department_team dt ON dt.id = p.team_id
    WHERE ${wlConditions.join(" AND ")}
    ORDER BY d.name, w.updated_at DESC`,
    wlParams
  );

  if (!workflows || workflows.length === 0) return [];

  const workflowIds: number[] = workflows.map((w: any) => w.id);
  const idPlaceholders = workflowIds.map(() => "?").join(",");

  // Step 2: ดึงข้อมูลย่อยทั้งหมดด้วย IN clause แยก query
  const results = await Promise.all([
    dbConnection.query(
      `SELECT wd.workflow_id, wd.department_id, wd.team_id, d.name AS department_name, dt.name AS team_name
       FROM workflow_departments wd
       LEFT JOIN department d ON d.id = wd.department_id
       LEFT JOIN department_team dt ON dt.id = wd.team_id
       WHERE wd.workflow_id IN (${idPlaceholders})`,
      workflowIds
    ),
    dbConnection.query(
      `SELECT wr.workflow_id, wr.position AS position_id, p.name AS position_name, wr.responsibility, wr.name, wr.uid
       FROM workflow_roles wr
       LEFT JOIN \`position\` p ON p.id = wr.position
       WHERE wr.workflow_id IN (${idPlaceholders})`,
      workflowIds
    ),
    dbConnection.query(
      `SELECT workflow_id, name, target, unit FROM workflow_kpis WHERE workflow_id IN (${idPlaceholders})`,
      workflowIds
    ),
    dbConnection.query(
      `SELECT workflow_id, id, step_name, input_trigger, output_result, description, duration_value, duration_unit, is_condition AS \`condition\`, next_step, issues, suggestions FROM workflow_steps WHERE workflow_id IN (${idPlaceholders}) ORDER BY id`,
      workflowIds
    ),
    dbConnection.query(
      `SELECT workflow_id, step_id, id, system_id, usage_detail, system_name FROM workflow_systems WHERE workflow_id IN (${idPlaceholders})`,
      workflowIds
    ),
    dbConnection.query(
      `SELECT workflow_id, step_id, system_id, \`index\`, link FROM workflow_system_links WHERE workflow_id IN (${idPlaceholders})`,
      workflowIds
    ),
    dbConnection.query(
      `SELECT workflow_id, step_id, detail, next_step FROM workflow_conditions WHERE workflow_id IN (${idPlaceholders})`,
      workflowIds
    ),
    dbConnection.query(
      `SELECT wns.workflow_id, wns.step_id, wns.next_step, ws.step_name AS next_step_name
       FROM workflow_next_steps wns
       LEFT JOIN workflow_steps ws ON ws.id = wns.next_step
       WHERE wns.workflow_id IN (${idPlaceholders})`,
      workflowIds
    ),
    dbConnection.query(
      `SELECT wsp.workflow_id, wsp.step_id, CAST(wsp.position_id AS CHAR) AS position_id, p.name AS position_name
       FROM workflow_step_participants wsp
       LEFT JOIN \`position\` p ON p.id = wsp.position_id
       WHERE wsp.workflow_id IN (${idPlaceholders}) AND wsp.role = 'E' AND wsp.position_id IS NOT NULL`,
      workflowIds
    ),
    dbConnection.query(
      `SELECT wsp.workflow_id, wsp.step_id, CAST(wsp.position_id AS CHAR) AS position_id, p.name AS position_name
       FROM workflow_step_participants wsp
       LEFT JOIN \`position\` p ON p.id = wsp.position_id
       WHERE wsp.workflow_id IN (${idPlaceholders}) AND wsp.role = 'R' AND wsp.position_id IS NOT NULL`,
      workflowIds
    ),
  ]);

  const relatedDepts = results[0][0] as any[];
  const roles = results[1][0] as any[];
  const kpis = results[2][0] as any[];
  const stepsRaw = results[3][0] as any[];
  const systemsRaw = results[4][0] as any[];
  const systemLinksRaw = results[5][0] as any[];
  const conditions = results[6][0] as any[];
  const nextSteps = results[7][0] as any[];
  const executors = results[8][0] as any[];
  const receivers = results[9][0] as any[];

  // Step 3: group ข้อมูลย่อยตาม workflow_id
  const groupBy = (arr: any[], key: string) =>
    arr.reduce((acc: any, item: any) => {
      const k = item[key];
      if (!acc[k]) acc[k] = [];
      acc[k].push(item);
      return acc;
    }, {});

  const relatedDeptsMap = groupBy(relatedDepts, "workflow_id");
  const rolesMap = groupBy(roles, "workflow_id");
  const kpisMap = groupBy(kpis, "workflow_id");
  const stepsMap = groupBy(stepsRaw, "workflow_id");
  const systemsMap = groupBy(systemsRaw, "workflow_id");
  const conditionsMap: any = {};
  const nextStepsMap: any = {};
  const executorsMap: any = {};
  const receiversMap: any = {};

  for (const c of conditions) {
    const k = `${c.workflow_id}_${c.step_id}`;
    if (!conditionsMap[k]) conditionsMap[k] = [];
    conditionsMap[k].push({ detail: c.detail, next_step: c.next_step });
  }
  for (const ns of nextSteps) {
    const k = `${ns.workflow_id}_${ns.step_id}`;
    if (!nextStepsMap[k]) nextStepsMap[k] = [];
    nextStepsMap[k].push({ next_step: ns.next_step, next_step_name: ns.next_step_name ?? String(ns.next_step) });
  }
  for (const ex of executors) {
    const k = `${ex.workflow_id}_${ex.step_id}`;
    if (!executorsMap[k]) executorsMap[k] = [];
    executorsMap[k].push(ex.position_name ?? ex.position_id);
  }
  for (const rv of receivers) {
    const k = `${rv.workflow_id}_${rv.step_id}`;
    if (!receiversMap[k]) receiversMap[k] = [];
    receiversMap[k].push(rv.position_name ?? rv.position_id);
  }

  // group system links: key = step_id_system_id_index
  const sysLinksMap: any = {};
  for (const sl of systemLinksRaw) {
    const k = `${sl.step_id}_${sl.system_id}_${sl.index}`;
    if (!sysLinksMap[k]) sysLinksMap[k] = [];
    sysLinksMap[k].push(sl.link);
  }

  // Step 4: รวมข้อมูลทั้งหมด
  return workflows.map((wf: any, index: number) => {
    const wfId = wf.id;

    const wfSystems = systemsMap[wfId] ?? [];
    const systemsByStep: any = {};
    for (const sys of wfSystems) {
      if (!systemsByStep[sys.step_id]) systemsByStep[sys.step_id] = [];
      systemsByStep[sys.step_id].push({
        id: sys.system_id,
        usage_detail: sys.usage_detail,
        system_name: sys.system_name,
        links: sysLinksMap[`${sys.step_id}_${sys.system_id}_${sys.id}`] ?? [],
      });
    }

    const steps = (stepsMap[wfId] ?? []).map((step: any) => ({
      id: step.id,
      step_name: step.step_name,
      input_trigger: step.input_trigger,
      output_result: step.output_result,
      description: step.description,
      duration_value: step.duration_value,
      duration_unit: step.duration_unit,
      condition: step.condition,
      next_step: step.next_step,
      issues: step.issues,
      suggestions: step.suggestions,
      systems: systemsByStep[step.id] ?? [],
      conditions: conditionsMap[`${wfId}_${step.id}`] ?? [],
      next_steps: nextStepsMap[`${wfId}_${step.id}`] ?? [],
      executors: executorsMap[`${wfId}_${step.id}`] ?? [],
      receivers: receiversMap[`${wfId}_${step.id}`] ?? [],
    }));

    return {
      index: index + 1,
      id: wfId,
      name: wf.name,
      doc_id: wf.doc_id,
      department_name: wf.department_name,
      department_code: wf.department_code,
      department_id: wf.department_id,
      status: wf.status,
      updated_at: wf.updated_at,
      created_at: wf.created_at,
      overall_duration_unit: wf.overall_duration_unit,
      overall_duration_value: wf.overall_duration_value,
      responsible_position_id: wf.responsible_position_id,
      responsible_id: wf.responsible_id,
      start_date: wf.start_date,
      iso_compliance: wf.iso_compliance,
      iso_procedure_id: wf.iso_procedure_id,
      objective: wf.objective,
      start_point: wf.start_point,
      expected_result: wf.expected_result,
      duration_impact_factors: wf.duration_impact_factors,
      workflow_impact: wf.workflow_impact,
      frequency: wf.frequency,
      step: wf.step,
      updated_by_name: wf.updated_by_name,
      team_name: wf.team_name,
      responsible_position_name: wf.responsible_position_name ?? "",
      flow_type: wf.flow_type_label,
      related_departments: (relatedDeptsMap[wfId] ?? []).map((d: any) => ({
        department_id: d.department_id,
        team_id: d.team_id,
        department_name: d.department_name ?? "",
        team_name: d.team_name ?? "",
      })),
      roles: (rolesMap[wfId] ?? []).map((r: any) => ({
        position: r.position_id,
        position_name: r.position_name,
        responsibility: r.responsibility,
        name: r.name,
        uid: r.uid,
      })),
      kpis: (kpisMap[wfId] ?? []).map((k: any) => ({
        name: k.name,
        target: k.target,
        unit: k.unit,
      })),
      steps,
    };
  });
};

export const getPositionEmployeeByWorkflowsId = async (id: number) => {
  const [rows]: any[] = await dbConnection.query(
    `select 
    case wr.position when 0 then wr.uid
    else pe.id end
    AS id,
    case wr.position when 0 then wr.name
    else pe.name end
    AS name,
    case wr.position when 0 then null
    else pe.employee_name end
    AS employee_name
    FROM workflow_roles wr
    left join (
    SELECT 
          p.id, 
          p.name, 
          CONCAT(e.name_th, ' (', e.nickname, ')') AS employee_name
        FROM position p
        LEFT JOIN employee e ON e.position_id = p.id
        LEFT JOIN department d ON d.id = p.department_id
    ) pe on pe.id = wr.position
    WHERE  wr.workflow_id = ?;
`,
    [id]
  );

  return rows; // คืนค่า index 0 หรือ null ถ้าไม่มีข้อมูล
};
