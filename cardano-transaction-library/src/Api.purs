module Api
  ( config
  , contract
  , finalize
  , initialize
  , run
  )
  where

import Prelude

import Contract.Config (ContractParams, testnetNamiConfig)
import Contract.JsSdk (mkContractEnvJS, stopContractEnvJS)
import Contract.Monad (Contract, ContractEnv, runContractInEnv)
import Control.Promise (Promise, fromAff)
import Data.Function.Uncurried (Fn1, mkFn1)
import Effect.Unsafe (unsafePerformEffect)

contract :: Contract Unit
contract = pure unit

initialize :: Fn1 ContractParams (Promise ContractEnv)
initialize = mkContractEnvJS

finalize :: Fn1 ContractEnv (Promise Unit)
finalize = stopContractEnvJS

run :: Fn1 ContractEnv (Promise Unit)
run = mkFn1 \env ->
  unsafePerformEffect $ fromAff $ runContractInEnv env contract

config  :: ContractParams
config = testnetNamiConfig -- use Nami wallet
