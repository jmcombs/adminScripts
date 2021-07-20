######## 
# Powershell Script for Active Directory DNS Record Creation
# Jeremy Combs CCIE Voice #23890
########

# This script does the following:
#   Imports IP Address and Hostname from a CSV file
#   Creates DNS A and and associated PTR (Reverse Lookup) Records
#
# The following are assumed:
#   - Reverse Lookup Zones are pre-defined and created to third octect
#       Example: Subnet: 192.168.5.0 /24 has Reverse Lookup defined in DNS as 5.168.192.in-addr.arpa
#   - This PS is ran from an Administrator workstation or the DNS server itself from PowerShell in Admin Mode
#   - User must have appropriate admin rights to create DNS A & PTR Records

# Create dnsrecords.csv file with 'IPv4Address' and 'Hostname' information 
#   Example (dnsrecords.csv):
#   IPAddress,Hostname 
#   hostname1,192.168.5.10 
#   hostname2,192.168.5.11
#   hostname3,192.168.5.12

# Define Global Variables for running PS.
# Define DNS Server Name to create records on
$serverName = "DC1" 
# Define DNS Domain Name
$domain = "contoso.com" 
# Define DNS Records CSV Path
$dnsRecordsCsv = 'c:\contoso_add_dnsrecords_1.csv'
# Import DNS Records CSV as 'dnsRecords'
$dnsRecords = Import-Csv -Path $dnsRecordsCsv

# Create DNS A and PTR Record for each entry in CSV
Foreach ($record in $dnsRecords) {
    # Define Local Variables for each Object
    # FQDN for PTR Record
    $fqdn = "$($record.Hostname).$domain"
    # Split IP Address into a 'addr' array by using "." as delimiter
    $addr = $record.IPv4Address -split "\."
    # Create Reverse Lookup Zone by re-appending 'addr' array backwards
    $reverseZone = "$($addr[1]).$($addr[0]).in-addr.arpa"
    # Create Hostname for PTR Reocrd
    $reverseHostname = "$($addr[3]).$($addr[2])"
    # Create RecordData for PTR Record which is 'FQDN.'; Used for verification
    $PtrRecord = "$($fqdn)."

    # Check for existing A Record 
    $checkDnsARecord = Get-DnsServerResourceRecord -ZoneName $domain -RRType A -Name $record.Hostname -ErrorAction SilentlyContinue
    if (-Not $null -eq $checkDnsARecord) {
        #Existing A Record Found
        Write-Output -Verbose "Skipping A Record for $($fqdn); Already exists"
        $record.ARecordResults = "Record already exists"
    }  
    else {
        #No existing A Record Found
        #Create A Record and Log Results
        Add-DnsServerResourceRecord -ZoneName $domain -A -Name $record.Hostname -IPv4Address $record.IPv4Address -Computer $serverName
        Write-Output -Verbose "Added A Record for $($fqdn)"
        $record.ARecordResults = "Successfully created"
    }
    # Check for existing PTR Record
    $checkDnsPTRRecord = Get-DnsServerResourceRecord -ZoneName $reverseZone -RRType PTR -Name $reverseHostname -ErrorAction SilentlyContinue
    if (-Not $null -eq $checkDnsPTRRecord) {
        #Existing PTR Record Found
        #Verify PTR Record matches Requested Record
        $checkDnsPTRRecordMatch = $checkDnsPTRRecord | Where-Object { $_.RecordData.PtrDomainName -Match $PtrRecord }
        if (-Not $null -eq $checkDnsPTRRecordMatch) {
            #Existing PTR Record matches Requested Record
            Write-Output -Verbose "Skipping PTR Record for $($PtrRecord); Already exists"
            $record.PTRRecordResults = "Record already exists"
        }
        else {
            #Existing PTR Record does not match Requested Record
            Write-Warning -Verbose "PTR Mismatch: $($checkDnsPTRRecord.RecordData.PtrDomainName) does not match $($PtrRecord)"
            $record.PTRRecordResults = "PTR Mismatch: $($checkDnsPTRRecord.RecordData.PtrDomainName)"
        }
    }
    else {
        #No existing PTR Record Found
        #Create PTR Record and Log Results
        Add-DnsServerResourceRecord -Name $reverseHostname -Ptr -ZoneName $reverseZone -AllowUpdateAny -PtrDomainName $fqdn -Computer $serverName
        Write-Output -Verbose "Added PTR Record for $($fqdn)"
        $record.PTRRecordResults = "Successfully created"
    }
}
#Write-Output -Verbose $dnsRecords
$dnsRecords | Export-Csv -NoTypeInformation -Path $dnsRecordsCsv
