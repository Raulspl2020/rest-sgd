const cnx = require('../config/database');


let auditoria = (id) => {

    return cnx
        .where({'username': id,'action':'login'})
        .select('id', 'inserted_date', 'username','ip_user')
        .from('sc_log_accesosistema');
};


module.exports = {
    auditoria
};