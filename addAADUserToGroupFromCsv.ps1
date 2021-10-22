######## 
# Powershell Script for Adding Azure Active Directory Users to Security Group
# Jeremy Combs CCIE Voice #23890
########

# This script does the following:
#   - Imports user list from CSV
#   - Queries Azure AD for Object ID of User first by 'Mail' and then by 'UserPrincipalName'
#   - Adds User to Azure AD Security Group by Group Display Name and User's ObjectID

# The following are assumed:
#   - Uses Azure Az PowerShell Module
#   - Azure AD Session is already authenticated via `Connect-AzAccount`
#   - Will run on Linux, macOS (pwsh) or Windows

# Set CSV filename for imported list of Users to query in Azure Active Directory
$aadUsersCsv = '/home/coder/files/aadusers.csv'
# Import Users CSV as 'aadUsers'
$aadUsers = Import-Csv -Path $aadUsersCsv
# Set Group Name to add Users to
$aadGrpName = 'CTP-SG-CiscoWebex-Cloud-Collab'

# Loop through `aadUsers` Array, query Azure AD for User's ObjectID and add User to Azure AD Security Group `aadGrpName' Object
Foreach ($aadUser in $aadUsers) {
# Query Azure AD for User Details - First, Last Name, Display Name, UPN, Mail and Account Status
    # Search by `Mail`
    $result = Get-AzADUser -Mail $aadUser.email | select id
    if (-Not $result) {
        # Search by `Mail` failed; Searching by -UserPrincipalName 
        $result = Get-AzADUser -UserPrincipalName $aadUser.email | select id
        if (-Not $result) {
            # User does not exist; display error and update `aadUser.result`
            Write-Warning "User $($aadUser.email) not found"
            $aadUser.aadGroupResult = "User not found"
        }
    }
    if ($result) {
        try {
            # User exists; adding to Azure AD Security Group `aadGrpName' object and update `aadUser.result`
            Add-AzADGroupMember -MemberObjectId $result.id -TargetGroupDisplayName $aadGrpName -ErrorAction Stop
            $aadUser.aadGroupResult = "Success"
            Write-Output "Successfully added $($aadUser.email) to $($aadGrpName)"
        } catch {
            if ($_.Exception.Message -eq "One or more added object references already exist for the following modified properties: 'members'.") {
                # User is already member of Security Group
                Write-Warning "$($aadUser.email) is already a member of $($aadGrpName)"
                $aadUser.aadGroupResult = "User is already a member of Security Group"
            } else {
                # Failed for some other reason
                Write-Warning -Verbose $_.Exception.Message
                $aadUser.aadGroupResult = $_.Exception.Message
            }
        }
    }
}
# Write-Output of `aadUsers` array to CSV
$aadUsers | Export-Csv -NoTypeInformation -Path $aadUsersCsv