use serenity::client::{Context, EventHandler};
use serenity::model::gateway::Ready;

pub struct Handler;

impl EventHandler for Handler {
    fn ready(&self, _: Context, ready: Ready) {
        let [shard_id, shard_total] = ready.shard.unwrap();
        println!(
            "Shard {}/{} ready ! Connected as {}",
            shard_id + 1,
            shard_total,
            ready.user.tag()
        );
    }
}
