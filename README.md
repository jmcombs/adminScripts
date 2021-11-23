# powershell-scripts

General PowerShell Scripts

# PowerShell Commands for Cisco CVI

Sets policy to `$null` and takes time for the policy to reflect  
`Grant-CsTeamsVideoInteropServicePolicy -PolicyName $null -Identity user@domain.com`

Shows all CVI Policies  
`Get-CsTeamsVideoInteropServicePolicy`

Shows policy for a specific user  
`Get-CsOnlineUser -Identity user@domain.com | Select-Object TeamsVideoInteropServicePolicy`

Sets policy to `CiscoServiceProviderEnabled`  
`Grant-CsTeamsVideoInteropServicePolicy -PolicyName CiscoServiceProviderEnabled -Identity user@domain.com`

Shows users with `ServiceProviderDisabled`  
`Get-CsOnlineUser -Filter {TeamsVideoInteropServicePolicy -eq 'ServiceProviderDisabled'} | Select-Object displayname, userprincipalname`
