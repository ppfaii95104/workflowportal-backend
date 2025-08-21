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
    INSERT INTO workflows (name, department_id, created_at, doc_id,step)
    VALUES (?, ?, NOW(), ?,0)
    `,
    [data.name, data.department_id, docId]
  );

  // คืนค่า insertId หรือ docId ก็ได้
  return { id: (insertResult as any).insertId, docId };
};

export const getWorkflowsById = async (id: number) => {
  const [rows]: any[] = await dbConnection.query(
    `SELECT
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
                    'position', wr.position,
                    'responsibility', wr.responsibility
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
                    'condition', ws.is_condition,
                    'executor', ws.executor,
                    'receiver', ws.receiver,
                    'input_trigger', ws.input_trigger,
                    'output_result', ws.output_result,
                    'duration_value', ws.duration_value,
                    'duration_unit', ws.duration_unit,
                    'next_step', ws.next_step,
                    'issues', ws.issues,
                    'suggestions', ws.suggestions,
                    'systems', (
                        SELECT COALESCE(
                            JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'id', sys.system_id,
                                    'usage_detail', sys.usage_detail,
                                    'links', (
                                        SELECT COALESCE(
                                            JSON_ARRAYAGG(link.link),
                                            JSON_ARRAY()
                                        )
                                        FROM workflow_system_links link
                                        WHERE link.step_id = ws.id
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
    w.status
FROM workflows w
left join department d on d.id =w.department_id
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
          status=?,
          step=?
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
      data.status ?? 1,
      data.step ?? 1,
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
  if (data.length === 0) return;
  const values = data.map((kpi) => [
    workflowId,
    kpi.name,
    kpi.target,
    kpi.unit,
  ]);
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
  if (data.length === 0) return;
  const values = data.map((dep) => [
    workflowId,
    dep?.department_id,
    dep?.team_id,
  ]);
  await dbConnection.query(
    `INSERT INTO workflow_departments (workflow_id, department_id,team_id) VALUES ?`,
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
  if (data.length === 0) return;
  const values = data.map((role) => [
    workflowId,
    role.position,
    role.responsibility,
  ]);
  await dbConnection.query(
    `INSERT INTO workflow_roles (workflow_id, position, responsibility) VALUES ?`,
    [values]
  );
};

// ====== SYSTEMS (TABLE: workflow_systems, workflow_system_links) ======
export const addWorkflowSystems = async (
  data: SystemUsage[],
  workflowId: number,
  stepId: number
) => {
  for (const system of data) {
    const systemId = system.id;

    // insert workflow_systems
    await dbConnection.query(
      `INSERT INTO workflow_systems (workflow_id, step_id, system_id, usage_detail)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE usage_detail = VALUES(usage_detail)`,
      [workflowId, stepId, systemId, system.usage_detail]
    );

    // insert links safely
    const links = Array.isArray(system.links) ? system.links : [];
    for (const link of links) {
      if (!link) continue;
      await dbConnection.query(
        `INSERT IGNORE INTO workflow_system_links (workflow_id, step_id, system_id, link)
         VALUES (?, ?, ?, ?)`,
        [workflowId, stepId, systemId, link]
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
};

export const addSteps = async (data: WorkflowStep[], workflowId: number) => {
  if (data.length === 0) return;

  // mapping oldStepId → newStepId
  const stepIdMap: Record<number, number> = {};

  // insert steps และ systems
  for (const step of data) {
    const [result]: any = await dbConnection.query(
      `INSERT INTO workflow_steps 
      (workflow_id, step_name, is_condition, executor, receiver, input_trigger, output_result,
       duration_value, duration_unit, next_step, issues, suggestions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        workflowId,
        step.step_name,
        step.condition ? 1 : 0,
        step.executor ?? null,
        step.receiver ?? null,
        step.input_trigger ?? null,
        step.output_result ?? null,
        step.duration_value ?? null,
        step.duration_unit ?? null,
        step.next_step ?? null, // เราไม่แก้ workflow_steps.next_step
        step.issues ?? null,
        step.suggestions ?? null,
      ]
    );

    const newStepId = result.insertId;
    stepIdMap[step?.id] = newStepId; // map id เดิม → id ใหม่

    // insert systems ของ step
    if (step?.systems && step?.systems.length > 0) {
      await addWorkflowSystems(step?.systems, workflowId, newStepId);
    }
  }

  // insert conditions
  for (const step of data) {
    const newStepId = stepIdMap[step?.id];

    if (step?.conditions && step?.conditions.length > 0) {
      for (const c of step?.conditions) {
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
  // 1) update main workflow
  await updateWorkflowsById(data, workflowId);

  // 2) update KPIs
  await deleteKpi(workflowId);
  await addKpi(data.kpis, workflowId);

  // 3) update related departments
  await deleteRelatedDepartments(workflowId);
  await addRelatedDepartments(data.related_departments, workflowId);

  // 4) update roles
  await deleteRoles(workflowId);
  await addRoles(data.roles, workflowId);

  // 5) update steps (+ systems + conditions)
  await deleteSteps(workflowId);
  await addSteps(data.steps, workflowId);

  return { success: true };
};
export const getListWorkflow = async () => {
  const [rows] =
    await dbConnection.query(`SELECT w.id , w.name,w.doc_id, d.name department_name, w.status, w.updated_at,
    w.overall_duration_unit ,w.overall_duration_value
    from workflows w 
    left join department d  on d.id = w.department_id
    ORDER BY w.updated_at DESC`);
  return rows;
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
