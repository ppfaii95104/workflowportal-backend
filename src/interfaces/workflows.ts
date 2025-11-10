export interface createWorkflowsBody {
  name: string;
  department_id: number;
  created_by: number;
  related_departments: any[];
}

export interface WorkflowFormData {
  name: string; // ชื่อ Workflow
  start_date: string; // วันที่เริ่มใช้ Workflow
  department_id: number;
  responsible_position_id: number; // id ตำแหน่งผู้รับผิดชอบ
  responsible_id: number; // id ผู้รับผิดชอบ
  flow_type: "M" | "S"; // ประเภท Workflow
  iso_compliance: boolean; // ISO Compliance
  iso_procedure_id?: string; // ISO Procedure ID (optional)
  objective: string; // วัตถุประสงค์ของ Workflow
  start_point: string; // จุดเริ่มต้นของ Workflow
  expected_result: string; // ผลลัพธ์ที่ต้องการ
  overall_duration_value: number; // ระยะเวลาโดยรวม (number ตาม mock)
  overall_duration_unit: string; // หน่วยเวลาโดยรวม
  duration_impact_factors: string; // ปัจจัยที่ส่งผลต่อระยะเวลา
  workflow_impact: number; // mock ส่งเป็น number (1)
  frequency: string;
  kpis: KPIFormData[]; // รายการ KPI
  related_departments: number[]; // แผนกที่เกี่ยวข้อง (id)

  roles: WorkflowRole[]; // รายการบทบาทใน Workflow
  steps: WorkflowStep[]; // รายการขั้นตอนของ Workflow
  status: number;
  step: number;
  updated_by: number;
}

export interface SystemUsage {
  id: string;

  usage_detail: string;
  system_name: string;
  links: string[];
}

export interface WorkflowStep {
  id: any;
  step_name: string;
  condition: boolean;
  executors: string[];
  receivers: string[];
  input_trigger: string;
  output_result: string;
  duration_value?: string; // mock บาง step ไม่มี
  duration_unit?: string; // mock บาง step ไม่มี
  systems?: SystemUsage[]; // mock อาจไม่มี systems
  row?: number;

  // เฉพาะขั้นตอนที่มีเงื่อนไข
  conditions?: { detail: string; next_step: any }[];
  next_step?: string | number;
  issues?: string;
  suggestions?: string;
  description?: string;
}

export interface WorkflowRole {
  position: number; // ตำแหน่ง
  name: string; // หน้าที่ความรับผิดชอบ
  responsibility: string; // หน้าที่ความรับผิดชอบ
  uid: string; // หน้าที่ความรับผิดชอบ
}

export interface KPIFormData {
  name: string;
  target: string;
  unit: string;
}
