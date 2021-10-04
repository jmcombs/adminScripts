######## 
# Powershell Script for Exporting Azure Active Directory Users from CSV
# Jeremy Combs CCIE Voice #23890
########

# This script does the following:
#   - Imports user list from CSV
#   - Queries Azure AD for User's information from CSV first by `Mail` and then by `UserPrincipalName`

# The following are assumed:
#   - Uses Azure Az PowerShell Module
#   - Azure AD Session is already authenticated via `Connect-AzAccount`
#   - Will run on Linux, macOS (pwsh) or Windows

# Set CSV filename for imported list of Users to query in Azure Active Directory
$aadUsersCsv = '/home/coder/files/aadusers.csv'
# Set CSV filename for exported list of Azure Active Directory User data
$aadUserDataCsv = '/home/coder/files/userdata.csv'
# Import Users CSV as 'aadUsers'
$aadUsers = Import-Csv -Path $aadUsersCsv

# Loop through `aadUsers` array, query Azure AD for User's information and push `result` object into `aadUserData` Array
$aadUserData = Foreach ($aadUser in $aadUsers) {
    # Query Azure AD for User Details - First, Last Name, Display Name, UPN, Mail and Account Status
    # Search by `Mail`
    $result = Get-AzADUser -Mail $aadUser.email | select givenname,surname,displayname,userprincipalname,mail,accountenabled
    if (-Not $result) {
        # Search by `Mail` failed; Searching by -UserPrincipalName 
        $result = Get-AzADUser -UserPrincipalName $aadUser.email | select givenname,surname,displayname,userprincipalname,mail,accountenabled
        if (-Not $result) {
            # User does not exist; display error and update `aadUser.result`
            Write-Warning "User $($aadUser.email) not found"
            $aadUser.result = "User not found"
        }
    }
    if ($result) {
        # Custom: Adding CH Email and CH Org to AAD Data
        Add-Member -InputObject $result -MemberType NoteProperty -Name "Control Hub Email" -Value $aadUser.email
        Add-Member -InputObject $result -MemberType NoteProperty -Name "Control Hub Org" -Value $aadUser.chOrg
        # User exists; push `result` object into `aadUserData` array and update `aadUser.result`
        $result
        $aadUser.result = "Success"
    }
}
# Write-Output of `aadUserData` array to CSV
$aadUserData | Export-Csv -NoTypeInformation -Path $aadUserDataCsv
# Write-Output of `aadUsers` array to CSV
$aadUsers | Export-Csv -NoTypeInformation -Path $aadUsersCsv
