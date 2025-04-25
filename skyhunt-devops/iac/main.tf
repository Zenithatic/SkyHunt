# terraform init -- initialize the terraform project
# terraform plan -- create an execution plan
# terraform apply -- apply the changes
# terraform destroy -- destroy the infrastructure

# Specify Terraform settings
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  cloud { 
    organization = "zenithatic" 

    workspaces { 
      name = "SkyHunt" 
    } 
  } 
}

# Specify the AWS provider
provider "aws" {
  region = "us-east-1"
}

# Create a VPC
resource "aws_vpc" "vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "SkyHuntVPC"
  }
}

# Create an internet gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.vpc.id

  tags = {
    Name = "SkyHuntIGW"
  }
}