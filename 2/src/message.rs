use crate::data::{Canvas, Figure, Line};
use actix::prelude::*;

#[derive(Clone, Message)]
#[rtype(result = "()")]
pub struct SendCanvas(pub Canvas);

#[derive(Clone, Message)]
#[rtype(result = "()")]
pub struct AddFigure(pub Figure);

#[derive(Clone, Message)]
#[rtype(result = "()")]
pub struct AddLine(pub Line);

#[derive(Clone, Message)]
#[rtype(result = "Canvas")]
pub struct GetCanvas(pub Recipient<SendCanvas>);

#[derive(Clone, Message)]
#[rtype(result = "()")]
pub struct RemoveSession(pub Recipient<SendCanvas>);