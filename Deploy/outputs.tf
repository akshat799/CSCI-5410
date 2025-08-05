output "app_url" {
  description = "App Load Balancer DNS"
  value       = aws_lb.app.dns_name
}
