export enum BlockEvent {
  ProjectCreated = 'ProjectCreated',
  ProjectApproved = 'ProjectApproved',
  CarbonCreditMinted = 'CarbonCreditMinted',
  ProjectResubmitted = 'ProjectResubmitted',
  ProjectRejected = 'ProjectRejected',
  CarbonCreditRetired = 'CarbonCreditRetired',
  Transfer = 'Transfer',
  TransferKeepAlive = 'TransferKeepAlive',
  SellOrderCreated  = 'SellOrderCreated',
  SellOrderCancelled   = 'SellOrderCancelled',
  BuyOrderFilled   = 'BuyOrderFilled',
  TransferTokens = "Transfer",
  TransferAssets = "Transferred",
  Issued = "Issued",
  ProjectUpdated  = "ProjectUpdated",
  BatchGroupAdded = "BatchGroupAdded",
  MemberAdded = "MemberAdded",
  BuyOrderCreated = "BuyOrderCreated"

}

export interface AuthSession {
  address: string;
  authType: AuthType,

  message: string;
  signature: string;

  proxyaddress?: string;
  googleData?: any;
}

export enum AuthType {
  BitgreenWallet = 'BitgreenWallet',
  MetaMaskWallet = 'MetaMaskWallet',
  Google = 'Google'
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
