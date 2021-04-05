use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Default, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Figure {
    pub name: String,
    pub start: Vec<f64>,
    pub form: String,
    pub size: i32,
    pub b_size: i32,
    pub border_color: String,
    pub bg_color: String,
}

#[derive(Deserialize, Serialize, Default, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Line {
    pub name: String,
    pub x1: f64,
    pub y1: f64,
    pub x2: f64,
    pub y2: f64,
    pub size: i32,
    pub color: String
}

#[derive(Deserialize, Serialize, Default, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Canvas {
    pub figures: Vec<Figure>,
    pub lines: Vec<Line>
}