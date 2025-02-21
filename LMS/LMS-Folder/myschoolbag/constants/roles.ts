export const ROLES = {
    ADMIN: 'admin',
    TEACHER: 'teacher',
    PARENT: 'parent',
    STUDENT: 'student',
  } as const;
  
  export type RoleType = typeof ROLES[keyof typeof ROLES];
  