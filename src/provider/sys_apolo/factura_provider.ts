import { conAuth } from "../../config/database";

//verifica si un usuario con token tiene permiso para consumir el servicio
export const authTokenService = async (cod_service: any, token: any) => {
    let result = await conAuth
        .select('api_service.id_service', 'api_service.cod_service', 'api_service.descripcion', 'sec_groups.description', 'sec_users.login')
        .from("api_service_group")
        .join("api_service", "api_service_group.service_id", "=", "api_service.id_service")
        .join("sec_groups", "api_service_group.service_group_id", "=", "sec_groups.group_id")
        .join("sec_users_groups", "sec_users_groups.group_id", "=", "sec_groups.group_id")
        .join("sec_users", "sec_users_groups.login", "=", "sec_users.login")
        .where({ 'sec_users.token': token, 'api_service.cod_service': cod_service })
        .groupBy('api_service_group.id_service_usuario');
    return result;
};