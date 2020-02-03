use serenity::client::Context;
use serenity::framework::standard::macros::command;
use serenity::framework::standard::{Args, CommandResult};
use serenity::model::channel::Message;

use crate::ShardManagerContainer;

#[command]
pub fn stop(ctx: &mut Context, msg: &Message, _: Args) -> CommandResult {
    let data = ctx.data.read();

    if let Some(manager) = data.get::<ShardManagerContainer>() {
        msg.channel_id.say(&ctx.http, "Shutting down...")?;
        manager.lock().shutdown_all();
    } else {
        msg.channel_id
            .say(&ctx.http, "There was a problem getting the shard manager")?;
    }

    Ok(())
}
