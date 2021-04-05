use crate::{
    data::{Canvas, Figure, Line},
    message::{AddFigure, AddLine, GetCanvas, RemoveSession, SendCanvas},
};
use actix::prelude::*;

#[derive(Default)]
pub struct WsServer {
    canvas: Canvas,
    users: Vec<Recipient<SendCanvas>>,
}

impl Actor for WsServer {
    type Context = Context<Self>;
}

impl WsServer {
    pub fn add_line(&mut self, line: Line) {
        self.canvas.lines.push(line);

        for user in &self.users {
            let msg = SendCanvas(self.canvas.clone());
            let _ = user.do_send(msg);
        }
    }

    pub fn add_figure(&mut self, fig: Figure) {
        self.canvas.figures.push(fig);

        for user in &self.users {
            let msg = SendCanvas(self.canvas.clone());
            let _ = user.do_send(msg);
        }
    }
}

impl Handler<AddLine> for WsServer {
    type Result = MessageResult<AddLine>;

    fn handle(&mut self, msg: AddLine, _ctx: &mut Self::Context) -> Self::Result {
        self.add_line(msg.0);
        MessageResult(())
    }
}

impl Handler<AddFigure> for WsServer {
    type Result = MessageResult<AddFigure>;

    fn handle(&mut self, msg: AddFigure, _ctx: &mut Self::Context) -> Self::Result {
        self.add_figure(msg.0);
        MessageResult(())
    }
}

impl Handler<GetCanvas> for WsServer {
    type Result = MessageResult<GetCanvas>;

    fn handle(&mut self, msg: GetCanvas, _ctx: &mut Self::Context) -> Self::Result {
        self.users.push(msg.0);
        MessageResult(self.canvas.clone())
    }
}

impl Handler<RemoveSession> for WsServer {
    type Result = MessageResult<RemoveSession>;

    fn handle(&mut self, msg: RemoveSession, _ctx: &mut Self::Context) -> Self::Result {
        self.users.retain(|el| el != &msg.0);
        MessageResult(())
    }
}

impl SystemService for WsServer {}
impl Supervised for WsServer {}
