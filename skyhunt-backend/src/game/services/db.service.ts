import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import * as dotenv from 'dotenv';
import { UserData } from '../../interfaces/UserData';
import { GoogleUser } from 'src/interfaces/GoogleUser';
dotenv.config();

@Injectable()
export class DBService {
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
   * Retrieves a user from the DynamoDB table by their ID.
   * 
   * @param user - The Google user object containing id to be retrieved.
   * @returns A promise that resolves to the user object if found, or undefined if not found.
   */
  async getUser(user: GoogleUser): Promise<UserData | undefined> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        id: user.id,
      },
    });

    try {
      const { Item } = await this.dbclient.send(command);
      if (Item) {
        const userData: UserData = {
          id: Item.id,
          username: Item.username,
          image: Item.image,
          points: Item.points,
          prompt: Item.prompt,
          updated: Item.updated,
        };
        return userData;
      }
      return undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  /**
   * Updates a user's points in the DynamoDB table.
   * 
   * @param user - The Google user object containing id to be retrieved.
   * @param points - The points to be added to the user's current points.
   * @returns A promise that resolves to 0 if the operation is successful, or -1 if an error occurs.
   */
  async addPoints(user: GoogleUser, points: number): Promise<number> {
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        id: user.id
      },
      UpdateExpression: 'SET points = points + :points, updated = :updated',
      ConditionExpression: 'attribute_exists(id)',
      ExpressionAttributeValues: {
        ':points': points,
        ':updated': Date.now()
      },
      ReturnValues: 'UPDATED_NEW'
    });
  
    try {
      await this.dbclient.send(command);
      return 0;
    } catch (error) {
      console.error('Error adding points:', error);
      return -1;
    }
  }

  /**
   * Updates a user's prompt in the DynamoDB table.
   * 
   * @param user - The Google user object containing id to be retrieved.
   * @param prompt - The new prompt to be set for the user.
   * @returns A promise that resolves to 0 if the operation is successful, or -1 if an error occurs.
   */
  async updatePrompt(user: GoogleUser, prompt: string): Promise<number> {
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        id: user.id
      },
      UpdateExpression: 'SET prompt = :prompt, updated = :updated',
      ConditionExpression: 'attribute_exists(id)',
      ExpressionAttributeValues: {
        ':prompt': prompt,
        ':updated': Date.now()
      },
      ReturnValues: 'UPDATED_NEW'
    });

    try {
      await this.dbclient.send(command);
      return 0;
    } catch (error) {
      console.error('Error updating prompt:', error);
      return -1;
    }
  }
}
