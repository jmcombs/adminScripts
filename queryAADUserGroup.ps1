######## 
# Powershell Script for Exporting Azure Active Directory Users based on Group Memebership
# Jeremy Combs CCIE Voice #23890
########

# This script does the following:
#   - Queries Azure AD Group Membership by Group Display Name to get list of users
#   - Queries Azure AD for User's information

# The following are assumed:
#   - Uses Azure Az PowerShell Module
#   - Azure AD Session is already authenticated via `Connect-AzAccount`
#   - Will run on Linux, macOS (pwsh) or Windows

# Set CSV filename for expored list of Azure Active Directory User data
$aadUserDataCsv = '/home/coder/files/userdata.csv'
# Set Group Name to Search Azure AD for
$aadGrpName = 'CTP-SG-CiscoWebex-Cloud-Collab'

# Query Azure AD Group Memebership by Group Display Name and store in `aadGrpMembers` Array
$aadGrpMembers = Get-AzADGroupMember -GroupDisplayName $aadGrpName
# Loop through `aadGrpMembers` Array, query Azure AD for User's information and push 'result' object into `aadUserData` Array
$aadUserData = Foreach ($aadUser in $aadGrpMembers) {
    # Query Azure AD for User Details - First, Last Name, Display Name, UPN, Mail and Account Status
    $result = Get-AzADUser -ObjectId $aadUser.Id | select givenname,surname,displayname,userprincipalname,mail,accountenabled
    if ($result) {
        # User exists; push 'result' object into 'aadUserData' array
        $result
    }
}
#Write-Output of `aadUserData` array to CSV
$aadUserData | Export-Csv -NoTypeInformation -Path $aadUserDataCsv
