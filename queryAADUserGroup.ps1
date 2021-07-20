######## 
# Powershell Script for Exporting Azure Active Directory Users based on Group Memebership
# Jeremy Combs CCIE Voice #23890
########

# This script does the following:
#   - Gets Azure AD Group ObjectID based off of provided Group Name (aka Display Name)
#   - Queries Azure AD Group by ObjectID to get list of users
#   - Queries Azure AD for User's information

# The following are assumed:
#   - Azure AD Session is already authenticated via `Connect-AzureAD`

# Set CSV File Name for Expored Users
$aadCsv = 'C:\aadusers.csv'

# Set Group Name to Search Azure AD for
$aadGrpName = 'All Company'
# Get Azure AD Group ObjectID
$aadGrpId = Get-AzureADGroup -All $true | Where-Object DisplayName -eq "$($aadGrpName)" | Select-Object -ExpandProperty ObjectId
# Query Azure AD Group Memebership for User ObjectIDs and store in `aadGrpMembers` Object
$aadGrpMembers = Get-AzureADGroupMember -ObjectId $aadGrpId -All $true
# Loop through `aadGrpMembers` Object and query Azure AD for User's information and store in `aadUserList` Object
$aadUserList = Foreach ($aadUser in $aadGrpMembers) {
    # Query Azure AD for User Details - First, Last Name, Display Name, UPN, Mail and Primary SMTP Address (should match)
    Get-AzureADUser -ObjectId $aadUser.ObjectId | select givenname,surname,displayname,userprincipalname,mail,@{E={$_.ProxyAddresses -cmatch '^SMTP\:.*' -replace '^SMTP:'};name='Primary E-Mail Address'} | Write-Output
}
#Write-Output of `aadUserList` Object to CSV
$aadUserList | Export-Csv -NoTypeInformation -Path $aadCsv
