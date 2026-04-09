$langs = @(
  @{language="python";     version="3.10.0"},
  @{language="node";       version="18.15.0"},
  @{language="typescript"; version="5.0.3"},
  @{language="java";       version="15.0.2"},
  @{language="gcc";        version="10.2.0"},
  @{language="mono";       version="6.12.0"},
  @{language="go";         version="1.16.2"},
  @{language="rust";       version="1.50.0"},
  @{language="ruby";       version="3.0.1"}
)

foreach ($l in $langs) {
  Write-Host "Installing $($l.language) $($l.version)..."
  Invoke-RestMethod -Uri "http://localhost:2000/api/v2/packages" -Method POST -ContentType "application/json" -Body ($l | ConvertTo-Json)
}
Write-Host "Done"
