use aiken/collection/list
use cardano/address.{Address}
use cardano/transaction.{OutputReference, Transaction}
use cardano/tx.{verify_signature}
use cocktail/vodka_address.{address_pub_key}
use contract/types.{Remove, Store, Update}
use types/cip68.{CIP68}

validator store(owners: List<Address>) {
  spend(
    _datum_option: Option<CIP68>,
    redeemer: Store,
    _output_reference: OutputReference,
    transaction: Transaction,
  ) {
    let Transaction { inputs: _inputs, outputs: _outputs, extra_signatories, .. } = transaction
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
      Update -> is_authorized
      Remove -> is_authorized
    }
  }

  else(_) {
    fail
  }
}
