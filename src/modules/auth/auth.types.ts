import { UserRole } from "./entities/auth.entity";

export interface ValidatePayloadTypes{
    email:string,
    id:string,
    role:UserRole,
    tokenVersion:number
}