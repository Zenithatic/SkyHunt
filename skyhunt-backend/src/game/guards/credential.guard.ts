import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import { GoogleUser } from 'src/interfaces/GoogleUser';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class CredentialGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = request.cookies['access_token'];
    
    if (!token) {
      return false; 
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as GoogleUser;
      request.user = decoded; 
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
