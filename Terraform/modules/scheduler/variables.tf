variable "project_name" { 
    type = string 
}
variable "tags"         { 
    type = map(string) 
    }

variable "analyze_lambda_function_name" { 
    type = string 
    }
variable "analyze_lambda_function_arn"  { 
    type = string 
    }

variable "categorize_lambda_function_name" { 
    type = string 
    }
variable "categorize_lambda_function_arn"  { 
    type = string 
    }