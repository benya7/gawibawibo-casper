#![no_std]
#![no_main]

#[cfg(not(target_arch = "wasm32"))]
compile_error!("target arch should be wasm32: compile with '--target wasm32-unknown-unknown'");

// We need to explicitly import the std alloc crate and `alloc::string::String` as we're in a
// `no_std` environment.
extern crate alloc;

use alloc::{
  string::{String, ToString},
  collections::BTreeMap,
  vec::{Vec},
  vec,
};
use core::convert::TryInto;
use casper_contract::{
    contract_api::{
      runtime::{
        get_caller, 
        get_key, 
        get_named_arg, 
        put_key, 
        call_contract, 
        revert, 
        ret, 
        blake2b
      }, 
      storage::{
        dictionary_get, 
        dictionary_put, 
        new_contract, 
        new_dictionary, 
        new_uref
      },
    },
    unwrap_or_revert::UnwrapOrRevert,
};
use casper_types::{
  ApiError, 
  EntryPoint,
  EntryPoints,
  EntryPointType,
  EntryPointAccess,
  CLType,
  CLTyped,
  CLValue,
  Parameter,
  RuntimeArgs,
  URef,
  bytesrepr::{ToBytes},
  contracts::{NamedKeys},
  account::{AccountHash},
};

const STATE_CONTRACT_KEY: &str = "state_contract";

#[no_mangle]
pub extern "C" fn new_move() {
    
  let new_move_id: u32 = get_named_arg("new_move_id");
  let owner_account_hash: String = get_caller().to_string();
  let owner_blend_hash: String = get_named_arg("owner_blend_hash");
  let dict_uref: URef = get_uref(STATE_CONTRACT_KEY);

  let mut moves = dictionary_get::<BTreeMap::<u32, ((u32, String, String), (Option<String>, Option<String>), (String, Option<String>))>>(dict_uref, "moves")
        .unwrap_or_revert_with(ApiError::ValueNotFound)
        .unwrap_or_revert_with(ApiError::MissingKey);
  if moves.contains_key(&new_move_id) {
    revert(ApiError::DuplicateKey)
  }
  moves.insert(new_move_id.clone(), ((new_move_id, owner_account_hash, owner_blend_hash), (None, None), ("unplayed".to_string(), None)));
  dictionary_put(dict_uref, "moves", moves);
}

#[no_mangle]
pub extern "C" fn cancel_move() {
    
  let target_move_id: u32 = get_named_arg("target_move_id");
  let dict_uref: URef = get_uref(STATE_CONTRACT_KEY);
  let mut moves = dictionary_get::<BTreeMap::<u32, ((u32, String, String), (Option<String>, Option<String>), (String, Option<String>))>>(dict_uref, "moves")
        .unwrap_or_revert_with(ApiError::ValueNotFound)
        .unwrap_or_revert_with(ApiError::MissingKey);
  let mut target_move: ((u32, String, String), (Option<String>, Option<String>), (String, Option<String>)) = moves.get(&target_move_id)
        .unwrap_or_revert_with(ApiError::ValueNotFound).clone();
  let owner_account_hash: String = get_caller().to_string();
  if target_move.0.1 != owner_account_hash {
    revert(ApiError::PermissionDenied)
  }
  if target_move.2.1.is_some() {
    revert(ApiError::PermissionDenied)
  }
  target_move.2.0 = "cancelled".to_string();
  moves.insert(target_move_id, target_move);
  dictionary_put(dict_uref, "moves", moves);

}

#[no_mangle]
pub extern "C" fn play_move() {

  let adversary_account_hash: String = get_caller().to_string();
  let adversary_blend_hash: String = get_named_arg("adversary_blend_hash");
  let target_move_id: u32 = get_named_arg("target_move_id");
  let dict_uref: URef = get_uref(STATE_CONTRACT_KEY);
  let mut moves = dictionary_get::<BTreeMap::<u32, ((u32, String, String), (Option<String>, Option<String>), (String, Option<String>))>>(dict_uref, "moves")
        .unwrap_or_revert_with(ApiError::ValueNotFound)
        .unwrap_or_revert_with(ApiError::MissingKey);
  
  let mut target_move: ((u32, String, String), (Option<String>, Option<String>), (String, Option<String>)) = moves.get(&target_move_id)
        .unwrap_or_revert_with(ApiError::ValueNotFound).clone();
  
  if target_move.0.1 == adversary_account_hash.to_string() {
    // Caller is equal owner move
    revert(ApiError::PermissionDenied)
  }
  if target_move.2.0 != "unplayed".to_string() {
    // Move played
    revert(ApiError::InvalidArgument)
  }

  let mut counter_game = [0, 0];
  let blend_owner = get_blends_numbers(target_move.0.1.clone(), target_move.0.2.clone());
  let blend_adversary = get_blends_numbers(adversary_account_hash.clone(), adversary_blend_hash.clone());
  
  for (i, val) in blend_owner.iter().enumerate() {
    let option_owner = val.clone();
    let option_adversary = blend_adversary[i].clone();
    let game = [option_owner, option_adversary];
    match game {
        [147, 369] => counter_game[0] += 1,
        [258, 147] => counter_game[0] += 1,
        [369, 258] => counter_game[0] += 1,
        [369, 147] => counter_game[1] += 1,
        [147, 258] => counter_game[1] += 1,
        [258, 369] => counter_game[1] += 1,
        [147, 147] => (),
        [258, 258] => (),
        [369, 369] => (),
        _ => (),
    }
  }

      target_move.1.0 = Some(adversary_account_hash.clone());
      target_move.1.1 = Some(adversary_blend_hash);

    if counter_game[0] == counter_game[1] {
      // game tied!
      target_move.2.0 = "tied".to_string()
    } else {
        target_move.2.0 = "played".to_string();
        if counter_game[0] > counter_game[1] {
          // Winner is owner
            target_move.2.1 = Some(target_move.0.1.clone());
        } else {
          // Winner is adversary
            target_move.2.1 = Some(adversary_account_hash);
        }
          

    }
      moves.insert(target_move_id.clone(), target_move);
      dictionary_put(dict_uref, "moves", moves);
    
}

#[no_mangle]
pub extern "C" fn constructor() {

  let sender: AccountHash = get_caller();
  let contract_hash: String = get_named_arg("contract_hash");
  let state_contract_uref = new_dictionary("state_contract").unwrap_or_revert();
  let sender_uref = new_uref(sender.to_string());
  let contract_hash_uref = new_uref(contract_hash);
  // Tuple3 of Tuple2 and Tuple3
  // La primera tupla, es el id, owner_account_hash, owner_blend_hash.
  // La segunda tupla, es el adversary_account_hash, adversary_blend_hash.
  // La tercer tupla es el status del move y el account_hash, del winner.
  let moves = BTreeMap::<u32, ((u32, String, String), (Option<String>, Option<String>), (String, Option<String>))>::new();

  put_key("owner", sender_uref.into());
  put_key("contract_hash", contract_hash_uref.into());
  dictionary_put(state_contract_uref, "moves", moves);


}

//  #[no_mangle]
//  pub extern "C" fn deposit() {
//    let account_hash: AccountHash = get_caller();
//   let adversary_move_blend: String = get_named_arg("adversary_move_blend");

//    let test_hash: String = get_blends_numbers_2(account_hash.to_string(), adversary_move_blend);
  
//   let mut args_moves_of = RuntimeArgs::new();
//   args_moves_of.insert("account_hash".to_string(), account_hash.to_string()).unwrap_or_revert();
  
//   let result_moves_of = call_contract::<Vec<(String, Option<String>, String)>>(
//     ContractHash::from_formatted_str(&contract_hash).unwrap(),
//     "moves_of",
//     args_moves_of);

//   let result_get_unplayed_moves = call_contract::<Vec<(u32, String)>>(
//   ContractHash::from_formatted_str(&contract_hash).unwrap(),
//   "get_unplayed_moves",
//   args_moves_of);
  
//    let test_hash_uref: URef = new_uref(test_hash);
//   let result_get_unplayed_moves_uref: URef = new_uref(result_get_unplayed_moves);
//    put_key("test_hash", test_hash_uref.into());
//   put_key("unplayed_moves_test", result_get_unplayed_moves_uref.into());

// }

#[no_mangle]
pub extern "C" fn call() {
    let mut entry_points = EntryPoints::new();
    let named_keys = NamedKeys::new();
    entry_points.add_entry_point(EntryPoint::new(
        "constructor",
        vec![
            Parameter::new("contract_hash", String::cl_type()),
        ],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));
    entry_points.add_entry_point(EntryPoint::new(
        "new_move",
        vec![
          Parameter::new("new_move_id", u32::cl_type()),
          Parameter::new("owner_blend_hash", String::cl_type()),
        ],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));
    entry_points.add_entry_point(EntryPoint::new(
        "cancel_move",
        vec![
          Parameter::new("target_move_id", u32::cl_type()),
        ],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));
    entry_points.add_entry_point(EntryPoint::new(
        "play_move",
        vec![
          Parameter::new("target_move_id", u32::cl_type()),
          Parameter::new("adversary_blend_hash", String::cl_type()),
        ],
        Option::<String>::cl_type(),
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));
    let (contract_hash, _) = new_contract(
        entry_points,
        Some(named_keys),
        None,
        None,
    );
    put_key("gawibawibo_v0.1", contract_hash.into());
    let mut args = RuntimeArgs::new();
    args.insert("contract_hash".to_string(), contract_hash.to_formatted_string()).unwrap_or_revert();
    call_contract(contract_hash, "constructor", args)
}

/// Gets [`URef`] under a name.
fn get_uref(name: &str) -> URef {
    let key = get_key(name)
        .ok_or(ApiError::MissingKey)
        .unwrap_or_revert();
    key.try_into().unwrap_or_revert()
}


fn get_blends_numbers (public_key: String, hash_blend: String) -> Vec<u64> {
  let n_blend: Vec<u64> = vec![147, 258, 369];
  let options = vec![
  "a8241dee1b",
  "9c3ef738a5",
  "9c4bea65e9",
  "038e16cdf9",
  "481ddbfbe9",
  "69343e02fa",
  "1af577cdd3",
  "f070fae536",
  "686690db1f",
  "f611d744c5",
  "444c34bf26",
  "5463570d5e",
  "8aa9d396ea",
  "76a27a71ee",
  "41f3de6eed",
  "d999fb7fe8",
  "8792ba8121",
  "68d0ea14ef",
  "c11af4a478",
  "823f07b380",
  "4432146540",
  "0f1514d671",
  "62d63583cb"
  ];

  let options_hashes: Vec<String> = options
  .clone()
  .into_iter()
  .map(|option| {
    let mut path = Vec::new();
    path.append(&mut option.to_bytes().unwrap_or_revert());
    path.append(&mut public_key.to_bytes().unwrap_or_revert());
    let key_bytes = blake2b(&path);
    hex::encode(key_bytes)
  })
  .collect();


  let mut pattern = "";

  for (index, option) in options_hashes.clone().into_iter().enumerate() {
    if option == hash_blend {
      pattern = options[index];
    }
  }

  match pattern {
    "a8241dee1b" => {
      vec![n_blend[0], n_blend[0], n_blend[0]]
    },
    "9c3ef738a5" => {
      vec![n_blend[1], n_blend[0], n_blend[0]]
    },
    "9c4bea65e9" => {
      vec![n_blend[2], n_blend[0], n_blend[0]]
    },
    "038e16cdf9" => {
      vec![n_blend[0], n_blend[1], n_blend[0]]
    },
    "481ddbfbe9" => {
      vec![n_blend[0], n_blend[2], n_blend[0]]
    },
    "69343e02fa" => {
      vec![n_blend[0], n_blend[0], n_blend[1]]
    },
    "1af577cdd3" => {
      vec![n_blend[0], n_blend[0], n_blend[2]]
    },
    "f070fae536" => {
      vec![n_blend[1], n_blend[1], n_blend[1]]
    },
    "686690db1f" => {
      vec![n_blend[0], n_blend[1], n_blend[1]]
    },
    "f611d744c5" => {
      vec![n_blend[2], n_blend[1], n_blend[1]]
    },
    "444c34bf26" => {
      vec![n_blend[1], n_blend[0], n_blend[1]]
    },
    "5463570d5e" => {
      vec![n_blend[1], n_blend[2], n_blend[1]]
    },
    "8aa9d396ea" => {
      vec![n_blend[1], n_blend[1], n_blend[0]]
    },
    "76a27a71ee" => {
      vec![n_blend[1], n_blend[1], n_blend[2]]
    },
    "41f3de6eed" => {
      vec![n_blend[2], n_blend[2], n_blend[2]]
    },
    "d999fb7fe8" => {
      vec![n_blend[0], n_blend[2], n_blend[2]]
    },
    "8792ba8121" => {
      vec![n_blend[1], n_blend[2], n_blend[2]]
    },
    "68d0ea14ef" => {
      vec![n_blend[2], n_blend[0], n_blend[2]]
    },
    "c11af4a478" => {
      vec![n_blend[2], n_blend[1], n_blend[2]]
    },
    "823f07b380" => {
      vec![n_blend[2], n_blend[2], n_blend[0]]
    },
    "4432146540" => {
      vec![n_blend[2], n_blend[2], n_blend[1]]
    },
    "0f1514d671" => {
      vec![n_blend[0], n_blend[1], n_blend[2]]
    },
    "62d63583cb" => {
      vec![n_blend[2], n_blend[1], n_blend[0]]
    },
    _ => vec![0, 0 ,0]
  }

}