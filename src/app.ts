import dotenv  from 'dotenv';

dotenv.config();
import './config/config';
import  Server  from './models/Server';

const server = new Server();
server.listen();


