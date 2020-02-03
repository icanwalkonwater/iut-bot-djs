#[macro_use]
extern crate dotenv_codegen;

use std::collections::HashSet;
use std::sync::Arc;
use std::thread;
use std::time::Duration;

use dotenv;
use serenity::client::bridge::gateway::ShardManager;
use serenity::framework::standard::macros::group;
use serenity::framework::StandardFramework;
use serenity::prelude::{Mutex, TypeMapKey};
use serenity::Client;

use crate::commands::stop::*;
use crate::event_handler::Handler;
use serenity::model::id::UserId;

mod commands;
mod event_handler;

// Container to access the shard manager from the data of the command framework
struct ShardManagerContainer;

impl TypeMapKey for ShardManagerContainer {
    type Value = Arc<Mutex<ShardManager>>;
}

// Command groups
#[group]
#[commands(stop)]
struct General;

fn main() {
    // Setup dotenv
    dotenv::dotenv().ok();

    // Create client
    let mut client = Client::new(dotenv!("TOKEN"), Handler).expect("Error creating client");

    // Setup shared data
    {
        let mut data = client.data.write();
        data.insert::<ShardManagerContainer>(Arc::clone(&client.shard_manager));
    }

    // Gather owners
    let owners = {
        let mut owners = HashSet::new();
        owners.insert(dotenv!("OWNER_ID").parse::<UserId>().unwrap());
        owners
    };

    // Setup command framework
    client.with_framework(
        StandardFramework::new()
            .configure(|c| {
                c.with_whitespace(false)
                    .prefix(dotenv!("COMMAND_PREFIX"))
                    .delimiter(' ')
                    .owners(owners)
            })
            .group(&GENERAL_GROUP),
    );

    // Start bot
    if let Err(why) = client.start_autosharded() {
        eprintln!("Client error: {:?}", why);
    }
}
