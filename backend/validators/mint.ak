use aiken/collection/list
use cardano/address.{Address}
use cardano/assets.{PolicyId}
use cardano/transaction.{Transaction}
use cardano/tx.{verify_signature}
use cocktail/vodka_address.{address_pub_key}
use contract/types.{Burn, Create, Mint}

validator mint(owners: List<Address>, _store: Address) {
  mint(redeemer: Mint, _policy_id: PolicyId, transaction: Transaction) {
    let Transaction { extra_signatories, .. } = transaction
    let is_authorized =
      list.any(
        owners,
        fn(owner) {
          when address_pub_key(owner) is {
            Some(key) -> verify_signature(extra_signatories, key)
            None -> False
          }
        },
      )

    when redeemer is {
      Create -> is_authorized
      Burn -> is_authorized
    }
  }

  else(_) {
    fail
  }
}
