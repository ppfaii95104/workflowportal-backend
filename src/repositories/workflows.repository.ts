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
    SELECT
    w.name,
    w.start_date,
    (
        SELECT COALESCE(
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'department_id', d.department_id,
                    'team_id', d.team_id
                )
            ),
            JSON_ARRAY()
        )
        FROM workflow_departments d
        WHERE d.workflow_id = w.id
    ) AS related_departments,
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
    (
        SELECT COALESCE(
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'position', CONCAT(wr.position),
                    'responsibility', wr.responsibility,
                    'name', wr.name,
                    'uid', wr.uid
                )
            ),
            JSON_ARRAY()
        )
        FROM workflow_roles wr
        WHERE wr.workflow_id = w.id
    ) AS roles,
    (
        SELECT COALESCE(
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
                    'systems', (
                        SELECT COALESCE(
                            JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'id', sys.system_id,
                                    'usage_detail', sys.usage_detail,
                                    'system_name', sys.system_name,
                                    'links', (
                                        SELECT COALESCE(
                                            JSON_ARRAYAGG(link.link),
                                            JSON_ARRAY()
                                        )
                                        FROM workflow_system_links link
                                        WHERE link.step_id = ws.id
                                        AND sys.system_id = link.system_id
                                        AND sys.id = link.index
                                    )
                                )
                            ),
                            JSON_ARRAY()
                        )
                        FROM workflow_systems sys
                        WHERE sys.step_id = ws.id
                    ),
                    'conditions', (
                        SELECT COALESCE(
                            JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'detail', wc.detail,
                                    'next_step', wc.next_step
                                )
                            ),
                            JSON_ARRAY()
                        )
                        FROM workflow_conditions wc
                        WHERE wc.step_id = ws.id
                    ),
                  'executors', (
              SELECT COALESCE(
                  JSON_ARRAYAGG(CAST(p.position_id AS CHAR)),
                  JSON_ARRAY()
              )
              FROM workflow_step_participants p
              WHERE p.step_id = ws.id
                AND p.role = 'E'
                AND p.position_id IS NOT NULL
          ),
          'receivers', (
              SELECT COALESCE(
                  JSON_ARRAYAGG(CAST(p.position_id AS CHAR)),
                  JSON_ARRAY()
              )
              FROM workflow_step_participants p
              WHERE p.step_id = ws.id
                AND p.role = 'R'
                AND p.position_id IS NOT NULL
  )
                )
            ),
            JSON_ARRAY()
        )
        FROM workflow_steps ws
        WHERE ws.workflow_id = w.id
    ) AS steps,
    w.overall_duration_value,
    w.overall_duration_unit,
    w.duration_impact_factors,
    w.workflow_impact,
    w.doc_id,
    (
        SELECT COALESCE(
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'name', k.name,
                    'target', k.target,
                    'unit', k.unit
                )
            ),
            JSON_ARRAY()
       )
        FROM workflow_kpis k
        WHERE k.workflow_id = w.id
    ) AS kpis,
    d.name AS department_name,
    d.department_code,
    w.updated_at,
    w.status,
    w.frequency
    FROM workflows w
    LEFT JOIN department d ON d.id = w.department_id
    WHERE w.id = ?;

`,
    [id]
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
       duration_value, duration_unit, next_step, issues, suggestions, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        workflowId,
        step.step_name,
        step.condition ? 1 : 0,
        step.input_trigger ?? null,
        step.output_result ?? null,
        step.duration_value ?? null,
        step.duration_unit ?? null,
        step.next_step ?? null,
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
      dt.name AS team_name
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
  console.log("🚀 ~ getListWorkflow ~ query:", query, params);

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
  console.log("🚀 ~ countListWorkflow ~ query:", query, params);

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
    output_result, duration_value, duration_unit, workflow_id,
    next_step, issues, suggestions, description)  
    SELECT  is_condition, step_name, input_trigger,
    output_result, duration_value, duration_unit, ?,
    next_step, issues, suggestions, description
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
  INSERT INTO workflow_conditions (step_id, detail, next_step,workflow_id)
  SELECT s.id AS new_step , wc.detail, ns.id AS next_step , ? AS workflow_id
	FROM  workflow_conditions wc 
	left join (SELECT wn_outer.id, wn_outer.step_name,wo.id AS old_step_id
	FROM workflow_steps wo
	LEFT JOIN (
	  SELECT *
	  FROM workflow_steps wn_inner
	  WHERE wn_inner.workflow_id = ?
	) AS wn_outer
	  ON wo.step_name = wn_outer.step_name
	where wo.workflow_id  = ?)
	s on s.old_step_id = wc.step_id
	left join (
	SELECT wn_outer.id, wn_outer.step_name,wo.id AS old_step_id
	FROM workflow_steps wo
	LEFT JOIN (
	  SELECT *
	  FROM workflow_steps wn_inner
	  WHERE wn_inner.workflow_id = ?
	) AS wn_outer
	  ON wo.step_name = wn_outer.step_name
	where wo.workflow_id  = ?
	) ns on ns.old_step_id = wc.next_step 
	where wc.workflow_id  = ?;
`,
    [
      workflowsId,
      workflowsId,
      body?.workflows_id,
      workflowsId,
      body?.workflows_id,
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
    (SELECT COUNT(*) FROM workflows w WHERE w.status = 1 AND w.department_id = d.id) AS draft,
    (SELECT COUNT(*) FROM workflows w WHERE w.status = 3 AND w.department_id = d.id) AS published
  FROM department d
  WHERE d.status IS NOT NULL
  AND d.id != 1
  ;`);
  return rows;
};
export const countTeam = async (body: WorkflowFormData) => {
  let query = `
  SELECT 
      dt.id,
      dt.name,
      (
        select count(*)
        from workflows w
       	LEFT JOIN \`position\` p ON p.id = w.responsible_position_id
        WHERE w.status = 1
        AND w.department_id = d.id
        AND p.team_id = dt.id
      ) AS draft,
      (
        select count(*)
        from workflows w
        LEFT JOIN \`position\` p ON p.id = w.responsible_position_id
        WHERE w.status = 3
        AND w.department_id = d.id
        AND p.team_id = dt.id
      ) AS published
    FROM department_team dt 
    left join department d  on dt.department_id   =  d.id
    WHERE d.status IS NOT NULL
  \n`;
  const params: any[] = [];

  if (body?.department_id) {
    query += ` AND dt.department_id = ? \n`;
    params.push(body.department_id);
  }

  query += ";";
  const [rows]: any[] = await dbConnection.query(query, params);

  return rows;
};
export const countTeamById = async (id: number) => {
  let query = `
   SELECT 
    d.id,
    d.department_code,
    d.name,
    (SELECT COUNT(*) FROM workflows w WHERE w.status = 1 AND w.department_id = d.id) AS draft,
    (SELECT COUNT(*) FROM workflows w WHERE w.status = 3 AND w.department_id = d.id) AS published
  FROM department d
  WHERE d.status IS NOT NULL
  \n`;
  const params: any[] = [];

  if (id) {
    query += ` AND d.id = ? \n`;
    params.push(id);
  }

  query += ";";
  const [rows]: any[] = await dbConnection.query(query, params);

  return rows ? rows[0] : {}; // คืนค่า index 0 หรือ null ถ้าไม่มีข้อมูล
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
