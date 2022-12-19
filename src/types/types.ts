export enum BlockEvent {
  ProjectCreated = 'ProjectCreated',
  ProjectApproved = 'ProjectApproved',
  CarbonCreditMinted = 'CarbonCreditMinted',
  ProjectResubmitted = 'ProjectResubmitted',
  ProjectRejected = 'ProjectRejected',
  CarbonCreditRetired = 'CarbonCreditRetired',
}

export interface WalletSession {
  message: string;
  signature: string;
  address: string;
}
