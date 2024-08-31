import axios from 'axios';

const clientApi = axios.create({
    baseURL: 'http://localhost:8000/api/clientes/',
})

const adminApi = axios.create({
    baseURL: 'http://localhost:8000/api/administradores/',
})



//Api para obtener todos los clientes
export const getAllClients = () => clientApi.get('/');
//Api para obtener todos los administradores
export const getAllAdmins = () => adminApi.get('/');

// Api para autenticar un usuario


