import { Injectable } from '@nestjs/common';
import { GoogleUser } from '../interfaces/GoogleUser';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import { UserData } from 'src/interfaces/UserData';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
dotenv.config();

@Injectable()
export class AuthService {
  private readonly dbclient: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor() {
    this.tableName = process.env.DYNAMODB_TABLE_NAME!;

    const dynamoDBClient = new DynamoDBClient({
      region: process.env.AWS_REGION,
    });

    this.dbclient = DynamoDBDocumentClient.from(dynamoDBClient);
  }
  
  /**
   * Logs a Google login attempt by sending an embed message to a Discord webhook.
   * 
   * @param user - The Google user object containing the following properties:
   *   - `username`: The display name of the user.
   *   - `id`: The unique Google ID of the user.
   *   - `image`: The URL of the user's Google profile picture.
   * 
   * @returns A promise that resolves when the message is successfully sent to the Discord webhook.
   */
  async logGoogleLogin(user: GoogleUser): Promise<any> {
    await fetch('https://discord.com/api/webhooks/1363920802809909365/8pTltwtt2VmioR3_5b27-5KC1VIoBM0hhbZS6EGcWAZk1sCOeTjB2QxbhgLzIK6hM76P', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [
          {
            title: 'New Google Login Attempt',
            description: `A user has logged in using Google OAuth.`,
            color: 3447003, // Blue
            fields: [
              { name: 'Username', value: user.username, inline: true },
              { name: 'User ID', value: user.id, inline: true }
            ],
            image: {
              url: user.image // Include the user's profile picture
            },
            timestamp: new Date().toISOString(),
            footer: {
              text: 'SkyHunt Authentication System'
            }
          }
        ]
      })
    });
  }

  /**
   * Generates a JWT token for the authenticated user.
   * 
   * @param user - The Google user object containing the following properties:
   *   - `username`: The display name of the user.
   *   - `id`: The unique Google ID of the user.
   *   - `image`: The URL of the user's Google profile picture.
   * 
   * @returns A promise that resolves to a JWT token string.
   */
  async generateJwt(user: GoogleUser): Promise<string> {
    const payload = {
      username: user.username,
      id: user.id,
      image: user.image,
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '24h' });
  }

  /**
   * Verifies the provided JWT token and returns the decoded user information.
   * 
   * @param token - The JWT token to verify.
   * 
   * @returns A promise that resolves to the decoded user information if the token is valid,
   *          or null if the token is invalid or expired.
   */
  async verifyJwt(token: string): Promise<GoogleUser | null> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as GoogleUser;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Adds a new user to the DynamoDB table.
   * 
   * @param user - The Google user object containing user data
   * @returns A promise that resolves to 0 if the operation is successful, or -1 if an error occurs.
   */
  async addUser(user: GoogleUser): Promise<number> {
    const userData: UserData = {
      id: user.id,
      username: user.username,
      image: user.image,
      points: 0,
      prompt: '',
      updated: Date.now(),
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: userData,
      ConditionExpression: 'attribute_not_exists(id)',
    });

    try {
      await this.dbclient.send(command);
      return 0;
    } catch (error) {
      console.error('Error adding user:', error);
      return -1;
    }
  }
}