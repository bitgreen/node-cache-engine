export enum BlockEvent {
  ProjectCreated = 'ProjectCreated',
  ProjectApproved = 'ProjectApproved',
  CarbonCreditMinted = 'CarbonCreditMinted',
  ProjectResubmitted = 'ProjectResubmitted',
  ProjectRejected = 'ProjectRejected',
  CarbonCreditRetired = 'CarbonCreditRetired',
  Transfer = 'Transfer',
  TransferKeepAlive = 'TransferKeepAlive',
}

export interface WalletSession {
  message: string;
  signature: string;
  address: string;
}

export interface Account {
  nonce: number, 
  consumers: number,
  providers: number,
  sufficients: number,
  data: BalanceData
}
export interface BalanceData {
  free: string, 
  reserved: number,
  miscFrozen: number,
  feeFrozen: number,
}
