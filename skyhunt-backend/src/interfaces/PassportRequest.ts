import { Request } from 'express';
import { GoogleUser } from './GoogleUser';

interface PassportRequest extends Request {
  user: GoogleUser;
}

export { PassportRequest };