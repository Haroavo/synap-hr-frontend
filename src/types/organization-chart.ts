export type OrganizationEmployeeStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "DEPARTED";

export type OrganizationDepartment = {
  id: string;
  code: string;
  name: string;
  active: boolean;
};

export type OrganizationPosition = {
  id: string;
  code: string;
  title: string;
  level: number;
  active: boolean;
};

export type OrganizationEmployee = {
  id: string;

  managerId: string | null;

  badgeNumber: string;

  firstName: string;
  lastName: string;
  fullName: string;

  email?: string | null;
  phone?: string | null;

  hireDate: string;

  status: OrganizationEmployeeStatus;

  profilePictureUrl?: string | null;

  department: OrganizationDepartment | null;

  position: OrganizationPosition | null;
};

export type OrganizationChartResponse = {
  data: OrganizationEmployee[];

  meta: {
    totalEmployees: number;
    totalRoots: number;
    totalDepartments: number;
  };
};
