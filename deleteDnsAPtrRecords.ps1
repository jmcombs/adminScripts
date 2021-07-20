######## 
# Powershell Script for Active Directory DNS Record Removal
# Jeremy Combs CCIE Voice #23890
########

# This script does the following:
#   Imports IP Address and Hostname from a CSV file
#   Removes (aka Deletes) DNS A and and associated PTR (Reverse Lookup) Records
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
$dnsRecordsCsv = 'c:\contoso_remove_dnsrecords_1.csv'
# Import DNS Records CSV as 'dnsRecords'
$dnsRecords = Import-Csv -Path $dnsRecordsCsv

# Remove DNS A and PTR Record for each entry in CSV
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
    # Create RecordData for PTR Record which is 'FQDN.'
    $PtrRecord = "$($fqdn)."

    # Check for existing A Record 
    $checkDnsARecord = Get-DnsServerResourceRecord -ZoneName $domain -RRType A -Name $record.Hostname -ErrorAction SilentlyContinue
    if (-Not $null -eq $checkDnsARecord) {
        #Existing A Record Found
        #Remove A Record and Log Results
        Remove-DnsServerResourceRecord -ZoneName $domain -RRType A -Name $record.Hostname -RecordData $record.IPv4Address -Force -Computer $serverName -ErrorAction SilentlyContinue
        Write-Output -Verbose "A Record for $($fqdn) removed"
        $record.ARecordResults = "Successfully removed"
    }  
    else {
        #No existing A Record Found
        Write-Output -Verbose "A Record for $($fqdn) not found"
        $record.ARecordResults = "Record not found"
    }
    # Check for existing PTR Record
    $checkDnsPTRRecord = Get-DnsServerResourceRecord -ZoneName $reverseZone -RRType PTR -Name $reverseHostname -ErrorAction SilentlyContinue
    if (-Not $null -eq $checkDnsPTRRecord) {
        #Existing PTR Record Found
        #Verify PTR Record matches Requested Record to be removed
        $checkDnsPTRRecordMatch = $checkDnsPTRRecord | Where-Object { $_.RecordData.PtrDomainName -Match $PtrRecord } -ErrorAction SilentlyContinue
        if (-Not $null -eq $checkDnsPTRRecordMatch) {
            #Existing PTR Record Found
            #Remove PTR Record and Log Results
            Remove-DnsServerResourceRecord -ZoneName $reverseZone -RRType PTR -Name $reverseHostname -RecordData $PtrRecord -Force -Computer $serverName -ErrorAction SilentlyContinue
            Write-Output -Verbose "PTR Record for $($PtrRecord) removed"
            $record.PTRRecordResults = "Successfully removed"
        }
        else {
            #Existing PTR Record does not match Requested Record to be removed
            Write-Warning -Verbose "PTR Mismatch: $($checkDnsPTRRecord.RecordData.PtrDomainName) does not match $($PtrRecord)"
            $record.PTRRecordResults = "PTR Mismatch: $($checkDnsPTRRecord.RecordData.PtrDomainName)"
        }
    }
    else {
        #No existing PTR Record Found; Assumed removed with A Record
        Write-Output -Verbose "PTR Record for $($fqdn) already removed"
        $record.PTRRecordResults = "Record removed with A Record"
    }
}
#Write-Output -Verbose $dnsRecords
$dnsRecords | Export-Csv -NoTypeInformation -Path $dnsRecordsCsv
