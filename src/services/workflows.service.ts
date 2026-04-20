import type { Request, Response } from "express";
import ExcelJS from "exceljs";
import {
  countDepartment,
  countListWorkflow,
  countTeam,
  countTeamById,
  createWorkflows,
  createWorkflowsImport,
  deleteWorkflow,
  duplicateWorkflow,
  getListWorkflow,
  getPositionEmployeeByWorkflowsId,
  getWorkflowReportData,
  getWorkflowsById,
  updateWorkflow,
  updateWorkflowsStatusById,
} from "../repositories/workflows.repository.js";
import { APIResponse } from "../utils/APIResponse.js";
import { StatusCodes } from "http-status-codes";
export const createWorkflow = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
  const data = req.body;
  const result = await createWorkflows(data);

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};
export const getWorkflowById = async (req: Request, res: Response) => {
  // const authHeader = req.headers["authorization"];
  // const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  // if (!token) {
  //   return res
  //     .status(StatusCodes.UNAUTHORIZED)
  //     .json(APIResponse.error("Access token required"));
  // }
  const idParam = req.params.id;

  // ตรวจสอบว่า id มีค่าและเป็นตัวเลข
  if (!idParam || isNaN(Number(idParam))) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(
        APIResponse.error(
          "Missing or invalid result ID",
          StatusCodes.BAD_REQUEST,
        ),
      );
  }

  const id = Number(idParam); // convert เป็น number
  const result = await getWorkflowsById(id);

  if (!result) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("Workflow not found", StatusCodes.NOT_FOUND));
  }

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};
export const updateWorkflowById = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
  const idParam = req.params.id;

  // ตรวจสอบว่า id มีค่าและเป็นตัวเลข
  if (!idParam || isNaN(Number(idParam))) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(
        APIResponse.error(
          "Missing or invalid result ID",
          StatusCodes.BAD_REQUEST,
        ),
      );
  }

  const id = Number(idParam); // convert เป็น number
  const data = req.body;
  const result = await updateWorkflow(id, data);

  if (!result) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("Workflow not found", StatusCodes.NOT_FOUND));
  }

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};
export const getWorkflowList = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
  const data = req.body;
  const result = await getListWorkflow(data);
  const count = await countListWorkflow(data);
  res
    .status(StatusCodes.OK)
    .json(
      APIResponse.successWithPaging(result, { ...data, total: count.total }),
    );
};

export const updateWorkflowStatusById = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
  const idParam = req.params.id;

  // ตรวจสอบว่า id มีค่าและเป็นตัวเลข
  if (!idParam || isNaN(Number(idParam))) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(
        APIResponse.error(
          "Missing or invalid result ID",
          StatusCodes.BAD_REQUEST,
        ),
      );
  }

  const id = Number(idParam); // convert เป็น number
  const data = req.body;
  const result = await updateWorkflowsStatusById(data, id);

  if (!result) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("Workflow not found", StatusCodes.NOT_FOUND));
  }

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};
export const importWorkflows = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
  const data = req.body;
  const result = await createWorkflowsImport(data?.data, data?.created_by);

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};

export const duplicateDataWorkflow = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
  const data = req.body;
  const result = await duplicateWorkflow(data);

  if (!result) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("Workflow not found", StatusCodes.NOT_FOUND));
  }

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};
export const deleteWorkflowById = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
  const idParam = req.params.id;

  // ตรวจสอบว่า id มีค่าและเป็นตัวเลข
  if (!idParam || isNaN(Number(idParam))) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(
        APIResponse.error(
          "Missing or invalid result ID",
          StatusCodes.BAD_REQUEST,
        ),
      );
  }

  const id = Number(idParam); // convert เป็น number
  const result = await deleteWorkflow(id);

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};
export const countDepartmentList = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
  const result = await countDepartment();

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};
export const countTeamtList = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
  const data = req.body;
  const body: any = {};
  const result = await countTeam(data);
  body.list_team = result;
  if (data?.department_id) {
    const result2 = await countTeamById(data?.department_id);
    body.department = result2;
  }
  res.status(StatusCodes.OK).json(APIResponse.success(body));
};

export const getPositionEmployeeListByWorkflowsId = async (
  req: Request,
  res: Response,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
  const idParam = req.params.id;

  // ตรวจสอบว่า id มีค่าและเป็นตัวเลข
  if (!idParam || isNaN(Number(idParam))) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(
        APIResponse.error(
          "Missing or invalid result ID",
          StatusCodes.BAD_REQUEST,
        ),
      );
  }

  const id = Number(idParam); // convert เป็น number

  const result = await getPositionEmployeeByWorkflowsId(id);

  if (!result) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("Workflow not found", StatusCodes.NOT_FOUND));
  }

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};

export const exportWorkflowReport = async (req: Request, res: Response) => {
  // const authHeader = req.headers["authorization"];
  // const token = authHeader && authHeader.split(" ")[1];

  // if (!token) {
  //   return res
  //     .status(StatusCodes.UNAUTHORIZED)
  //     .json(APIResponse.error("Access token required"));
  // }

  const body = req.body;
  const rows = await getWorkflowReportData(body);
  console.log("🚀 ~ exportWorkflowReport ~ rows:", rows);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Workflow Report");

  const statusLabel = (s: number) => {
    if (s === 1) return "Draft";
    if (s === 3) return "Published";
    return String(s);
  };

  const durationLabel = (value: any, unit: any) => {
    if (value == null) return "";
    const unitMap: Record<string, string> = {
      M: "นาที",
      H: "ชั่วโมง",
      D: "วัน",
    };
    return `${value} ${unitMap[unit] ?? unit ?? ""}`.trim();
  };

  const headerStyle = (cell: ExcelJS.Cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  };

  const cellBorder = (cell: ExcelJS.Cell) => {
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  };

  // ===== Sheet 1: ข้อมูลทั่วไป (Step 1) =====
  sheet.columns = [
    { header: "ลำดับ", key: "no", width: 8 },
    { header: "รหัสเอกสาร", key: "doc_id", width: 20 },
    { header: "ชื่อ Workflow", key: "name", width: 35 },
    { header: "วันที่เริ่มใช้", key: "start_date", width: 18 },
    { header: "แผนก", key: "department_name", width: 20 },
    { header: "ทีม", key: "team_name", width: 20 },
    {
      header: "ผู้รับผิดชอบ (ตำแหน่ง)",
      key: "responsible_position",
      width: 30,
    },
    { header: "แผนกที่เกี่ยวข้อง", key: "related_departments", width: 40 },
    { header: "ประเภท Workflow", key: "flow_type", width: 15 },
    { header: "ISO Compliance", key: "iso_compliance", width: 15 },
    { header: "ISO Procedure ID", key: "iso_procedure_id", width: 20 },
    { header: "สถานะ", key: "status", width: 12 },
    { header: "แก้ไขล่าสุดโดย", key: "updated_by_name", width: 25 },
    { header: "แก้ไขล่าสุด", key: "updated_at", width: 22 },
  ];

  sheet.getRow(1).eachCell(headerStyle);

  rows.forEach((row: any, index: number) => {
    const relatedDeptNames = (row.related_departments ?? [])
      .map((d: any) =>
        [d.department_name, d.team_name].filter(Boolean).join(" / "),
      )
      .filter(Boolean)
      .join(", ");

    const dataRow = sheet.addRow({
      no: index + 1,
      doc_id: row.doc_id,
      name: row.name,
      start_date:
        row.start_date ?
          new Date(row.start_date).toLocaleDateString("th-TH")
        : "",
      department_name: row.department_name ?? "",
      team_name: row.team_name ?? "",
      responsible_position: row.responsible_position_name ?? "",
      related_departments: relatedDeptNames,
      flow_type: row.flow_type ?? "",
      iso_compliance: row.iso_compliance == 1 ? "ใช่" : "ไม่ใช่",
      iso_procedure_id: row.iso_procedure_id ?? "",
      status: statusLabel(row.status),
      updated_by_name: row.updated_by_name ?? "",
      updated_at:
        row.updated_at ? new Date(row.updated_at).toLocaleString("th-TH") : "",
    });
    dataRow.eachCell(cellBorder);
  });

  // ===== Sheet 2: ภาพรวมของ Workflow (Step 2) =====
  const overviewSheet = workbook.addWorksheet("ภาพรวม Workflow");
  overviewSheet.columns = [
    { header: "รหัสเอกสาร", key: "doc_id", width: 20 },
    { header: "ชื่อ Workflow", key: "name", width: 35 },
    { header: "วัตถุประสงค์", key: "objective", width: 50 },
    { header: "จุดเริ่มต้นของ Workflow", key: "start_point", width: 50 },
    { header: "ผลลัพธ์ที่ต้องการ", key: "expected_result", width: 50 },
  ];

  overviewSheet.getRow(1).eachCell(headerStyle);

  rows.forEach((row: any) => {
    const dataRow = overviewSheet.addRow({
      doc_id: row.doc_id,
      name: row.name,
      objective: row.objective ?? "",
      start_point: row.start_point ?? "",
      expected_result: row.expected_result ?? "",
    });
    dataRow.eachCell((cell) => {
      cellBorder(cell);
      cell.alignment = { wrapText: true, vertical: "top" };
    });
  });

  // ===== Sheet 3: บทบาทใน Workflow (Step 3) =====
  const rolesSheet = workbook.addWorksheet("บทบาทใน Workflow");
  rolesSheet.columns = [
    { header: "รหัสเอกสาร", key: "doc_id", width: 20 },
    { header: "ชื่อ Workflow", key: "workflow_name", width: 35 },
    { header: "ตำแหน่ง", key: "position", width: 25 },
    { header: "หน้าที่รับผิดชอบ", key: "responsibility", width: 50 },
  ];

  rolesSheet.getRow(1).eachCell(headerStyle);

  rows.forEach((row: any) => {
    const roles = row.roles ?? [];
    roles.forEach((role: any) => {
      const dataRow = rolesSheet.addRow({
        doc_id: row.doc_id,
        workflow_name: row.name,
        position: role.position_name ?? "",
        responsibility: role.responsibility ?? "",
      });
      dataRow.eachCell((cell) => {
        cellBorder(cell);
        cell.alignment = { wrapText: true, vertical: "top" };
      });
    });
  });

  // ===== Sheet 4: รายละเอียดขั้นตอนการทำงาน (Step 4) =====
  const stepsSheet = workbook.addWorksheet("รายละเอียดขั้นตอน");
  stepsSheet.columns = [
    { header: "รหัสเอกสาร", key: "doc_id", width: 20 },
    { header: "ชื่อ Workflow", key: "workflow_name", width: 35 },
    { header: "ลำดับ Step", key: "step_no", width: 10 },
    { header: "ชื่อขั้นตอน", key: "step_name", width: 35 },
    { header: "ผู้ดำเนินการ", key: "executors", width: 30 },
    { header: "ผู้รับ", key: "receivers", width: 30 },
    { header: "Input / สิ่งกระตุ้น", key: "input_trigger", width: 35 },
    { header: "Output / ผลลัพธ์", key: "output_result", width: 35 },
    { header: "คำอธิบายรายละเอียดขั้นตอน", key: "description", width: 50 },
    { header: "ระบบ / เครื่องมือที่ใช้", key: "systems", width: 35 },
    { header: "ระยะเวลา", key: "duration", width: 15 },
    { header: "ปัญหา/อุปสรรค", key: "issues", width: 40 },
    { header: "เสนอแนะวิธีแก้ไข", key: "suggestions", width: 40 },
    { header: "ขั้นตอนถัดไป", key: "next_steps", width: 25 },
  ];

  stepsSheet.getRow(1).eachCell(headerStyle);

  rows.forEach((row: any) => {
    const steps = row.steps ?? [];
    steps.forEach((step: any, si: number) => {
      const systemNames = (step.systems ?? [])
        .map((s: any) => s.system_name ?? "")
        .filter(Boolean)
        .join(", ");
      const nextStepNames = (step.next_steps ?? [])
        .map((ns: any) => ns.next_step_name ?? ns.next_step ?? "")
        .filter(Boolean)
        .join(", ");
      const executorNames = (step.executors ?? []).join(", ");
      const receiverNames = (step.receivers ?? []).join(", ");

      const dataRow = stepsSheet.addRow({
        doc_id: row.doc_id,
        workflow_name: row.name,
        step_no: si + 1,
        step_name: step.step_name ?? "",
        executors: executorNames,
        receivers: receiverNames,
        input_trigger: step.input_trigger ?? "",
        output_result: step.output_result ?? "",
        description: step.description ?? "",
        systems: systemNames,
        duration: durationLabel(step.duration_value, step.duration_unit),
        issues: step.issues ?? "",
        suggestions: step.suggestions ?? "",
        next_steps: nextStepNames,
      });
      dataRow.eachCell((cell) => {
        cellBorder(cell);
        cell.alignment = { wrapText: true, vertical: "top" };
      });
    });
  });

  // ===== Sheet 5: Timeline รวม & KPI (Step 5) =====
  const kpiSheet = workbook.addWorksheet("Timeline & KPI");
  kpiSheet.columns = [
    { header: "รหัสเอกสาร", key: "doc_id", width: 20 },
    { header: "ชื่อ Workflow", key: "name", width: 35 },
    { header: "ระยะเวลาโดยรวม", key: "overall_duration", width: 18 },
    { header: "ความถี่ในการใช้งาน", key: "frequency", width: 30 },
    {
      header: "ปัจจัยที่มีผลต่อ KPI",
      key: "duration_impact_factors",
      width: 40,
    },
    { header: "ระดับผลกระทบของ Workflow", key: "workflow_impact", width: 28 },
    { header: "ชื่อ KPI", key: "kpi_name", width: 35 },
    { header: "เป้าหมาย", key: "kpi_target", width: 35 },
    { header: "หน่วย", key: "kpi_unit", width: 20 },
  ];

  kpiSheet.getRow(1).eachCell(headerStyle);

  rows.forEach((row: any) => {
    const kpis = row.kpis ?? [];
    if (kpis.length === 0) {
      const dataRow = kpiSheet.addRow({
        doc_id: row.doc_id,
        name: row.name,
        overall_duration: durationLabel(
          row.overall_duration_value,
          row.overall_duration_unit,
        ),
        frequency: row.frequency ?? "",
        duration_impact_factors: row.duration_impact_factors ?? "",
        workflow_impact: row.workflow_impact ?? "",
        kpi_name: "",
        kpi_target: "",
        kpi_unit: "",
      });
      dataRow.eachCell((cell) => {
        cellBorder(cell);
        cell.alignment = { wrapText: true, vertical: "top" };
      });
    } else {
      kpis.forEach((kpi: any, ki: number) => {
        const dataRow = kpiSheet.addRow({
          doc_id: ki === 0 ? row.doc_id : "",
          name: ki === 0 ? row.name : "",
          overall_duration:
            ki === 0 ?
              durationLabel(
                row.overall_duration_value,
                row.overall_duration_unit,
              )
            : "",
          frequency: ki === 0 ? (row.frequency ?? "") : "",
          duration_impact_factors:
            ki === 0 ? (row.duration_impact_factors ?? "") : "",
          workflow_impact: ki === 0 ? (row.workflow_impact ?? "") : "",
          kpi_name: kpi.name ?? "",
          kpi_target: kpi.target ?? "",
          kpi_unit: kpi.unit ?? "",
        });
        dataRow.eachCell((cell) => {
          cellBorder(cell);
          cell.alignment = { wrapText: true, vertical: "top" };
        });
      });
    }
  });

  const filename = `workflow-report-${Date.now()}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length", buffer.byteLength);
  res.send(Buffer.from(buffer));
};
