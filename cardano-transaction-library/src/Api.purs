module Api
  ( 
    -- config
  -- , contract
  -- , finalize
  -- , initialize
  -- , main
    paymentKeyFromEnvelope
  , privateKeyFromMnemonic
  , privateKeysToAddress
  -- , run
  , stakeKeyFromEnvelope
  )
  where

import Prelude

import Contract.Config (ContractParams, PrivatePaymentKey, PrivateStakeKey, testnetNamiConfig)
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

-- contract :: Contract Unit
-- contract = pure unit

-- initialize :: Fn1 ContractParams (Promise ContractEnv)
-- initialize = mkContractEnvJS

-- finalize :: Fn1 ContractEnv (Promise Unit)
-- finalize = stopContractEnvJS

-- run :: Fn1 ContractEnv (Promise Unit)
-- run = mkFn1 \env ->
--   unsafePerformEffect $ fromAff $ runContractInEnv env contract

-- config  :: ContractParams
-- config = testnetNamiConfig -- use Nami wallet

privateKeyFromMnemonic :: Fn1 String (Effect Bip32PrivateKey)
privateKeyFromMnemonic = mkFn1 \s ->
  case bip32PrivateKeyFromMnemonic s of
    Left err -> throwException $ error err
    Right key -> pure key

fromMaybe :: forall a . String -> Maybe a -> Effect a
fromMaybe errMsg Nothing = throwException $ error errMsg
fromMaybe _     (Just a) = pure a

privateKeysToAddress :: Fn3 String (Nullable PrivateStakeKey) Int (Effect Address)
privateKeysToAddress = mkFn3 \paymentKey stakeKey networkId -> do
  nid <- fromMaybe "Unknown Network Id" $ intToNetworkId networkId
  pk <- fromMaybe "Unable to decode private key" $ privateKeyFromBech32 paymentKey
  pure $ Wallet.Key.privateKeysToAddress (wrap pk) (toMaybe stakeKey) nid

paymentKeyFromEnvelope :: Fn1 String (Effect PrivatePaymentKey)
paymentKeyFromEnvelope = mkFn1 \envelopeString -> do
  envelope <- fromMaybe "Unable to decode text envelope" $ decodeTextEnvelope envelopeString
  fromMaybe "Unknown envelope type" $ privatePaymentKeyFromTextEnvelope envelope

stakeKeyFromEnvelope :: Fn1 String (Effect PrivateStakeKey)
stakeKeyFromEnvelope = mkFn1 \envelopeString -> do
  envelope <- fromMaybe "Unable to decode text envelope" (decodeTextEnvelope envelopeString)
  fromMaybe "Unknown envelope type" $ privateStakeKeyFromTextEnvelope envelope

-- main :: Effect Unit
-- main = do
--   log "🍝"
