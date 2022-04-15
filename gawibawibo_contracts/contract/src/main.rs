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
  format
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
        read, 
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
  bytesrepr::{ToBytes, FromBytes},
  contracts::{NamedKeys},
  account::{AccountHash},
};

const STATE_CONTRACT_KEY: &str = "state_contract";
/// An error enum which can be converted to a `u16` so it can be returned as an `ApiError::User`.
#[repr(u16)]
enum Error {
    KeyAlreadyExists = 0,
    KeyMismatch = 1,
}

impl From<Error> for ApiError {
    fn from(error: Error) -> Self {
        ApiError::User(error as u16)
    }
}

#[no_mangle]
pub extern "C" fn new_move() {
    
  let id: u32 = get_named_arg("id");
  let owner: String = get_caller().to_string();
  let winner: Option<String> = None;
  let move_blend: String = get_named_arg("move_blend");
  let dict_uref: URef = get_uref(STATE_CONTRACT_KEY);

  let mut moves = dictionary_get::<BTreeMap<u32, (String, Option<String>, String)>>(dict_uref, "moves_map")
        .unwrap_or_revert_with(ApiError::ValueNotFound)
        .unwrap_or_revert_with(ApiError::MissingKey);
  if moves.contains_key(&id) {
    revert(ApiError::DuplicateKey)
  }
  moves.insert(id.clone(), (owner, winner, move_blend));
  dictionary_put(dict_uref, "moves_map", moves);
}

#[no_mangle]
pub extern "C" fn moves_of() {

  let account_hash: String = get_named_arg("account_hash");
  let dict_uref: URef = get_uref(STATE_CONTRACT_KEY);
  let moves = dictionary_get::<BTreeMap<u32, (String, Option<String>, String)>>(dict_uref, "moves_map")
        .unwrap_or_revert_with(ApiError::ValueNotFound)
        .unwrap_or_revert_with(ApiError::MissingKey);
  let moves_user: Vec<(String, Option<String>, String)> = moves.values()
        .cloned()
        .filter(|m| m.0 == account_hash)
        .collect();
  ret(CLValue::from_t(moves_user).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn cancel_move() {
    
  let id: u32 = get_named_arg("id");
  let dict_uref: URef = get_uref(STATE_CONTRACT_KEY);
  let mut moves = dictionary_get::<BTreeMap<u32, (String, Option<String>, String)>>(dict_uref, "moves_map")
        .unwrap_or_revert_with(ApiError::ValueNotFound)
        .unwrap_or_revert_with(ApiError::MissingKey);
  let target_move: (String, Option<String>, String) = moves.get(&id).unwrap_or_revert_with(ApiError::ValueNotFound).clone();
  let owner: String = get_caller().to_string();
  if target_move.0 != owner {
    revert(ApiError::PermissionDenied)
  }
  if target_move.1.is_some() {
    revert(ApiError::PermissionDenied)
  }
  moves.remove(&id);
  dictionary_put(dict_uref, "moves_map", moves);

}

#[no_mangle]
pub extern "C" fn get_unplayed_moves() {
  let dict_uref: URef = get_uref(STATE_CONTRACT_KEY);
  let result = all_unplayed_moves(dict_uref);
  ret(CLValue::from_t(result).unwrap_or_revert());

}

#[no_mangle]
pub extern "C" fn play_move() {

  let adversary_hash: AccountHash = get_caller();
  let target_move_id: u32 = get_named_arg("target_move_id");
  let adversary_move_blend: String = get_named_arg("adversary_move_blend");
  let dict_uref: URef = get_uref(STATE_CONTRACT_KEY);
  let mut moves = dictionary_get::<BTreeMap<u32, (String, Option<String>, String)>>(dict_uref, "moves_map") 
        .unwrap_or_revert_with(ApiError::ValueNotFound)
        .unwrap_or_revert_with(ApiError::MissingKey);
  let target_move = moves.get(&target_move_id).unwrap_or_revert_with(ApiError::ValueNotFound);
  let mut winner: Option<String> = None;
  if target_move.1.is_some() {
    revert(ApiError::InvalidArgument)
  }
  let mut counter_game = [0, 0];
  let blend_owner = get_blends_numbers(target_move.0.clone(), target_move.2.clone());
  let blend_adversary = get_blends_numbers(adversary_hash.to_string(), adversary_move_blend);

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
        if counter_game[0] == counter_game[1] {
          // game tied!
          ret(CLValue::from_t(winner).unwrap_or_revert());
        } else {
            if counter_game[0] > counter_game[1] {
                winner = Some(target_move.0.clone());
            } else {
                winner = Some(adversary_hash.to_string());
            }
            moves.insert(target_move_id, (target_move.0.clone(), winner.clone(), target_move.2.clone()));

            ret(CLValue::from_t(winner).unwrap_or_revert());
        }

}

#[no_mangle]
pub extern "C" fn constructor() {

  let sender: AccountHash = get_caller();
  let contract_hash: String = get_named_arg("contract_hash");
  let state_contract_uref = new_dictionary("state_contract").unwrap_or_revert();
  let sender_uref = new_uref(sender.to_string());
  let contract_hash_uref = new_uref(contract_hash);
  let moves_map = BTreeMap::<u32, (String, Option<String>, String)>::new();
  put_key("owner", sender_uref.into());
  put_key("contract_hash", contract_hash_uref.into());
  dictionary_put(state_contract_uref, "moves_map", moves_map);
}

// #[no_mangle]
// pub extern "C" fn deposit() {
//   let account_hash: AccountHash = get_caller();
//   let contract_hash = read_from::<String>("contract_hash");
  
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
  
//   let result_moves_of_uref: URef = new_uref(result_moves_of);
//   let result_get_unplayed_moves_uref: URef = new_uref(result_get_unplayed_moves);

//   put_key("moves_test", result_moves_of_uref.into());
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
          Parameter::new("id", u32::cl_type()),
          Parameter::new("move_blend", String::cl_type()),
        ],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));
    entry_points.add_entry_point(EntryPoint::new(
        "cancel_move",
        vec![
          Parameter::new("id", u32::cl_type()),
        ],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));
    entry_points.add_entry_point(EntryPoint::new(
        "moves_of",
        vec![
          Parameter::new("account_hash", String::cl_type()),
        ],
        Vec::<(String, Option::<String>, String)>::cl_type(),
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));
    entry_points.add_entry_point(EntryPoint::new(
        "get_unplayed_moves",
        vec![],
        Vec::<(u32, String)>::cl_type(),
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));
    let (contract_hash, _) = new_contract(
        entry_points,
        Some(named_keys),
        None,
        None,
    );
    put_key("gawibawibo_11", contract_hash.into());
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

/// Reads value from a named key.
fn read_from<T>(name: &str) -> T
where
    T: FromBytes + CLTyped,
{
    let uref = get_uref(name);
    let value: T = read(uref).unwrap_or_revert().unwrap_or_revert();
    value
}
fn all_unplayed_moves(dict: URef) -> Vec<(u32, String)> {
  
  let mut moves = dictionary_get::<BTreeMap<u32, (String, Option<String>, String)>>(dict, "moves_map")
        .unwrap_or_revert_with(ApiError::ValueNotFound)
        .unwrap_or_revert_with(ApiError::MissingKey);
  let mut unplayed_moves: Vec<(u32, String)> = Vec::new();
  
  for (key, value) in moves.iter() {
    if value.1.is_none() {
      unplayed_moves.push((key.clone(), value.0.clone()))
    }
  }
  unplayed_moves

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