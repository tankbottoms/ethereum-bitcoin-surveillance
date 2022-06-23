export const event_signatures = [
  `AddedReceiver(uint256,address indexed,address indexed)`,
  `AddressSet(uint256,address)`,
  `AffirmationCompleted(address,uint256,bytes32)`,
  `AmountLimitExceeded(address,uint256,bytes32)`,
  `Approval(address indexed,address indexed,uint256 indexed)`,
  `Approval(address indexed,address indexed,uint256)`,
  `ApprovalForAll(address indexed,address indexed,bool)`,
  `AuthorizedOperator(address indexed,address indexed)`,
  `BallotCanceled(uint256 indexed,address indexed)`,
  `BallotCreated(uint256 indexed,uint256 indexed,address indexed)`,
  `BallotFinalized(uint256 indexed,address indexed)`,
  `Burn(address indexed,uint256)`,
  `Burned(address indexed,address indexed,uint256,bytes,bytes)`,
  `CanRelayFailed(address indexed,address indexed,address indexed,bytes4,uint256)`,
  `CancelledRequest(address indexed)`,
  `ChangeFinalized(address[])`,
  `ChangeRequestInitiated(address indexed)`,
  `Claim(address indexed,address indexed,uint256)`,
  `CodeCreated(address,uint256,string)`,
  `CollectedSignatures(address,bytes32,uint256)`,
  `Confirmation(address indexed,uint256 indexed)`,
  `Confirmed(address indexed,address,address)`,
  `DailyLimitChanged(uint256)`,
  `Deposit(address indexed,uint256)`,
  `Deposited(address indexed,address indexed,uint256)`,
  `Distribute(address indexed,address indexed,uint256,bytes)`,
  `DrawingCompleted(uint256,address,uint256,uint256)`,
  `Execution(uint256 indexed)`,
  `ExecutionDailyLimitChanged(uint256)`,
  `ExecutionFailure(uint256 indexed)`,
  `FinalizedChange(address indexed)`,
  `Foo(address indexed,uint256)`,
  `FundsBurnt(address,uint256,bool indexed)`,
  `FundsFrozen(address,uint256)`,
  `FundsSentTo(address indexed,address,uint256,bool indexed)`,
  `GasPriceChanged(uint256)`,
  `InitialKeyCreated(address indexed,uint256,uint256)`,
  `InitiateChange(bytes32 indexed,address[])`,
  `InterfaceImplementerSet(address indexed,bytes32 indexed,address indexed)`,
  `ManagerChanged(address indexed,address indexed)`,
  `MetadataCleared(address indexed)`,
  `MetadataCreated(address indexed)`,
  `MetadataMoved(address indexed,address indexed)`,
  `Migrated(string,address)`,
  `MiningKeyChanged(address,string)`,
  `Mint(address indexed,uint256)`,
  `Minted(address indexed,address indexed,uint256,bytes,bytes)`,
  `MinterAdded(address indexed)`,
  `MinterRemoved(address indexed)`,
  `MoCInitializedProxyStorage(address)`,
  `MultiSended(uint256,address)`,
  `NewRound(uint256,uint256)`,
  `OwnerAddition(address indexed)`,
  `OwnerRemoval(address indexed)`,
  `OwnershipTransferred(address indexed,address indexed)`,
  `OwnershipTransferred(address,address)`,
  `PayoutKeyChanged(address,address indexed,string)`,
  `Penalized(address indexed,address,uint256)`,
  `ProxyInitialized(address,address,address,address,address,address,address,address)`,
  `ProxyOwnershipTransferred(address,address)`,
  `RateChange(address indexed,uint256)`,
  `RelayAdded(address indexed,address indexed,uint256,uint256,uint256,string)`,
  `RelayHubChanged(address indexed,address indexed)`,
  `RelayRemoved(address indexed,uint256)`,
  `RelayedMessage(address,uint256,bytes32)`,
  `RequiredBlockConfirmationChanged(uint256)`,
  `RequiredSignaturesChanged(uint256)`,
  `RequirementChange(uint256)`,
  `Revocation(address indexed,uint256 indexed)`,
  `RevokedOperator(address indexed,address indexed)`,
  `Rewarded(address[],uint256[])`,
  `Sent(address indexed,address indexed,address indexed,uint256,bytes,bytes)`,
  `SignedForAffirmation(address indexed,bytes32)`,
  `SignedForUserRequest(address indexed,bytes32)`,
  `Staked(address indexed,uint256,uint256)`,
  `Submission(uint256 indexed)`,
  `ThresholdChanged(uint256 indexed,uint256)`,
  `TicketPurchased(uint256,address)`,
  `TransactionRelayed(address indexed,address indexed,address indexed,bytes4,uint8,uint256)`,
  `Transfer(address indexed,address indexed,uint256 indexed)`,
  `Transfer(address indexed,address indexed,uint256)`,
  `TransferData(address indexed,address indexed,bytes)`,
  `TransferWithData(address indexed,address indexed,uint256,bytes)`,
  `Unstaked(address indexed,uint256)`,
  `Upgraded(uint256,address indexed)`,
  `UserRequestForAffirmation(address,uint256)`,
  `UserRequestForSignature(address,uint256)`,
  `ValidatorAdded(address indexed)`,
  `ValidatorInitialized(address indexed,address indexed,address indexed)`,
  `ValidatorRemoved(address indexed)`,
  `Vote(uint256 indexed,uint256,address indexed,uint256,address)`,
  `VotingKeyChanged(address,address indexed,string)`,
  `WhitelistChanged(address indexed,bool)`,
  `Withdrawn(address indexed,address indexed,uint256)`,
];
