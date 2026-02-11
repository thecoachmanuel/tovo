Param()
$envPath = Join-Path (Get-Location) ".env"
if (Test-Path $envPath) {
  Get-Content $envPath | ForEach-Object {
    if ($_ -match '^\s*([^=#]+)\s*=\s*\"?(.*?)\"?\s*$') {
      $name = $matches[1]
      $value = $matches[2]
      [Environment]::SetEnvironmentVariable($name, $value)
    }
  }
}
$SUPABASE_URL = $env:NEXT_PUBLIC_SUPABASE_URL
$SERVICE_ROLE = $env:SUPABASE_SERVICE_ROLE_KEY
$ADMIN_EMAIL = $env:NEXT_PUBLIC_ADMIN_EMAIL
$ADMIN_PASSWORD = $env:ADMIN_PASSWORD
if (-not $SUPABASE_URL -or -not $SERVICE_ROLE -or -not $ADMIN_EMAIL -or -not $ADMIN_PASSWORD) {
  Write-Output "error: missing env"
  exit 1
}
$headers = @{ apikey = $SERVICE_ROLE; Authorization = "Bearer $SERVICE_ROLE" }
$bodyObj = @{
  email = $ADMIN_EMAIL
  password = $ADMIN_PASSWORD
  email_confirm = $true
  user_metadata = @{ role = "admin" }
}
$bodyJson = $bodyObj | ConvertTo-Json -Depth 5
try {
  Invoke-RestMethod -Method Post -Uri "$SUPABASE_URL/auth/v1/admin/users" -Headers $headers -ContentType "application/json" -Body $bodyJson | Out-Null
  Write-Output "created:true"
} catch {
  $resp = $_.Exception.Response
  $status = if ($resp) { $resp.StatusCode.value__ } else { -1 }
  if ($status -eq 409) {
    $userList = Invoke-RestMethod -Method Get -Uri "$SUPABASE_URL/auth/v1/admin/users?email=$ADMIN_EMAIL" -Headers $headers
    $id = $userList.users[0].id
    $patchBody = @{ user_metadata = @{ role = "admin" } } | ConvertTo-Json -Depth 5
    Invoke-RestMethod -Method Patch -Uri "$SUPABASE_URL/auth/v1/admin/users/$id" -Headers $headers -ContentType "application/json" -Body $patchBody | Out-Null
    Write-Output "created:false promoted:true"
  } else {
    Write-Output "error:true status:$status"
    exit 1
  }
}
