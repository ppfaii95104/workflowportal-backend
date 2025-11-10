export interface departmentBody {
  id: number;
  name: string;
  department_code: string;

  status: number;
  type: number;
  team: [];
  created_by: number;
  updated_by: number;
}
export interface teamBody {
  id: number;
  name: number;
  department_id: number;
  status: number;
  team_code: number;
}
export interface positionBody {
  id: number;
  name: number;
  job_band: number;
  department_id: number;
  team_id: number;
  status: number;
  created_by: number;
  updated_by: number;
}
