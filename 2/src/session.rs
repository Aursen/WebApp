use crate::data::Line;
use crate::{
    data::Figure,
    message::{AddFigure, AddLine, GetCanvas, SendCanvas, RemoveSession},
    server::WsServer,
};
use actix::prelude::*;
use actix_web_actors::ws;

#[derive(Default)]
pub struct WebSession;

impl WebSession {
    pub fn add_line(&mut self, ctx: &mut ws::WebsocketContext<Self>, line: Line){
        WsServer::from_registry()
            .send(AddLine(line))
            .into_actor(self)
            .then(|_, _, _| fut::ready(()))
            .wait(ctx);
    }

    pub fn add_figure(&mut self, ctx: &mut ws::WebsocketContext<Self>, figure: Figure) {
        WsServer::from_registry()
            .send(AddFigure(figure))
            .into_actor(self)
            .then(|_, _, _| fut::ready(()))
            .wait(ctx);
    }

    pub fn get_figures(&mut self, ctx: &mut ws::WebsocketContext<Self>) {
        WsServer::from_registry()
            .send(GetCanvas(ctx.address().recipient()))
            .into_actor(self)
            .then(|figures, _, ctx| {
                if let Ok(figures) = figures {
                    let res = serde_json::to_string(&figures).unwrap_or(String::new());
                    ctx.text(format!("canvas::{}", res));
                }
                fut::ready(())
            })
            .wait(ctx);
    }

    pub fn stop_session(&mut self, ctx: &mut ws::WebsocketContext<Self>) {
        WsServer::from_registry()
        .send(RemoveSession(ctx.address().recipient()))
        .into_actor(self)
        .then(|_, _, _| fut::ready(()))
        .wait(ctx);
    }
}

impl Actor for WebSession {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        self.get_figures(ctx);
    }

    fn stopped(&mut self, ctx: &mut Self::Context) {
        self.stop_session(ctx);
    }
}

impl Handler<SendCanvas> for WebSession {
    type Result = ();

    fn handle(&mut self, msg: SendCanvas, ctx: &mut Self::Context){
        let res = serde_json::to_string(&msg.0).unwrap_or(String::new());
        ctx.text(format!("canvas::{}", res));
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for WebSession {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        let msg = match msg {
            Err(_) => {
                ctx.stop();
                return;
            }
            Ok(msg) => msg,
        };
        match msg {
            ws::Message::Text(msg) => {
                let mut command = msg.splitn(2, "::");
                match command.next() {
                    Some("figure") => {
                        if let Some(c) = command.next() {
                            let figure: Figure = serde_json::from_str(c).unwrap_or_default();
                            self.add_figure(ctx, figure);
                        }
                    }
                    Some("line") => {
                        if let Some(c) = command.next() {
                            let line: Line = serde_json::from_str(c).unwrap_or_default();
                            self.add_line(ctx, line);
                        }
                    }
                    _ => (),
                }
            }
            ws::Message::Close(reason) => {
                ctx.close(reason);
                ctx.stop();
            }
            _ => ctx.stop(),
        }
    }
}
