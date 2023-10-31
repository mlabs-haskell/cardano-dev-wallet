module Api
  ( config
  , contract
  , finalize
  , initialize
  , paymentKeyFromEnvelope
  , privateKeyFromMnemonic
  , privateKeysToAddress
  , run
  , stakeKeyFromEnvelope
  )
  where

import Prelude

import Contract.Config (ContractParams, PrivatePaymentKey, PrivateStakeKey, blockfrostPublicPreviewServerConfig, mkBlockfrostBackendParams, testnetConfig)
import Contract.JsSdk (mkContractEnvJS, stopContractEnvJS)
import Contract.Monad (Contract, ContractEnv, runContractInEnv)
import Contract.TextEnvelope (decodeTextEnvelope)
import Contract.Wallet.KeyFile (privatePaymentKeyFromTextEnvelope, privateStakeKeyFromTextEnvelope)
import Control.Promise (Promise, fromAff)
import Ctl.Internal.Deserialization.Keys (privateKeyFromBech32)
import Ctl.Internal.Serialization.Address (intToNetworkId, Address)
import Ctl.Internal.Serialization.Types (Bip32PrivateKey)
import Ctl.Internal.Wallet.Bip32 (bip32PrivateKeyFromMnemonic)
import Ctl.Internal.Wallet.Key as Wallet.Key
import Data.Either (Either(..))
import Data.Function.Uncurried (Fn1, Fn3, mkFn1, mkFn3)
import Data.Maybe (Maybe(..))
import Data.Newtype (wrap)
import Data.Nullable (Nullable, toMaybe)
import Effect (Effect)
import Effect.Class.Console (log)
import Effect.Exception (error, throwException)
import Effect.Unsafe (unsafePerformEffect)

contract :: Contract Unit
contract = log "aa"

initialize :: Fn1 ContractParams (Promise ContractEnv)
initialize = mkContractEnvJS

finalize :: Fn1 ContractEnv (Promise Unit)
finalize = stopContractEnvJS

run :: Fn1 ContractEnv (Promise Unit)
run = mkFn1 \env ->
  unsafePerformEffect $ fromAff $ runContractInEnv env contract

config  :: ContractParams
config = testnetConfig {
    backendParams = blockfrostParams
  }
  where
    blockfrostParams = mkBlockfrostBackendParams {
        blockfrostConfig: blockfrostPublicPreviewServerConfig
      , blockfrostApiKey: Nothing
      , confirmTxDelay: Just (wrap 1000.0)
    }

privateKeyFromMnemonic :: Fn1 String (Bip32PrivateKey)
privateKeyFromMnemonic = mkFn1 \s -> unsafePerformEffect $
  case bip32PrivateKeyFromMnemonic s of
    Left err -> throwException $ error err
    Right key -> pure key

fromMaybe :: forall a . String -> Maybe a -> Effect a
fromMaybe errMsg Nothing = throwException $ error errMsg
fromMaybe _     (Just a) = pure a

privateKeysToAddress :: Fn3 String (Nullable PrivateStakeKey) Int Address
privateKeysToAddress = mkFn3 \paymentKey stakeKey networkId -> unsafePerformEffect $ do
  nid <- fromMaybe "Unknown Network Id" $ intToNetworkId networkId
  pk <- fromMaybe "Unable to decode private key" $ privateKeyFromBech32 paymentKey
  pure $ Wallet.Key.privateKeysToAddress (wrap pk) (toMaybe stakeKey) nid

paymentKeyFromEnvelope :: Fn1 String PrivatePaymentKey
paymentKeyFromEnvelope = mkFn1 \envelopeString -> unsafePerformEffect $ do
  envelope <- fromMaybe "Unable to decode text envelope" $ decodeTextEnvelope envelopeString
  fromMaybe "Unknown envelope type" $ privatePaymentKeyFromTextEnvelope envelope

stakeKeyFromEnvelope :: Fn1 String PrivateStakeKey
stakeKeyFromEnvelope = mkFn1 \envelopeString -> unsafePerformEffect $ do
  envelope <- fromMaybe "Unable to decode text envelope" (decodeTextEnvelope envelopeString)
  fromMaybe "Unknown envelope type" $ privateStakeKeyFromTextEnvelope envelope

-- main :: Effect Unit
-- main = do
--   log "🍝"
