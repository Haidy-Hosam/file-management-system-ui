export interface LoginRequest{
 email: string;
  password: string;
  rememberMe: boolean;
}

export interface authResponse{

    accessToken :string;
    refreshToken: string;
    u_id:number;
    name:string;
    email:string;
    role: string;
    departmentName:string;
    isDeleted:boolean;

}

export interface DecodedToken {
  sub: string;
  userId: number;
  role: string;
  deptId: number;
  exp: number;
}