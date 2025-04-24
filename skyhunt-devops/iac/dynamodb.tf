
resource "aws_dynamodb_table" "game_data" {
  name = "SkyHuntGameData"
  billing_mode = "PAY_PER_REQUEST"
  hash_key = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Name = "SkyHuntGameData"
    Environment = "Production"
  }
}