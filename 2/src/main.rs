mod data;
mod message;
mod mongo;
mod server;
mod session;

use crate::mongo::MongoClient;
use crate::session::WebSession;
use actix_files::{Files, NamedFile};
use actix_multipart::Multipart;
use futures::{StreamExt, TryStreamExt};
use std::io::Write;
use uuid::Uuid;

use actix_web::{
    get, middleware::Logger, post, web, App, Error, HttpRequest, HttpResponse, HttpServer,
};
use actix_web_actors::ws;

#[post("/save/{username}")]
async fn save_file(web::Path(username): web::Path<String>,mut payload: Multipart) -> Result<HttpResponse, Error> {
    while let Ok(Some(mut field)) = payload.try_next().await {
        let filename = format!("{}.png", Uuid::new_v4().to_simple());
        let filepath = format!("./img/{}", sanitize_filename::sanitize(&filename));

        let mut f = web::block(|| std::fs::File::create(filepath)).await?;

        while let Some(chunk) = field.next().await {
            let data = chunk.unwrap();
            f = web::block(move || f.write_all(&data).map(|_| f)).await?;
        }

        let db = MongoClient::init().await.unwrap();
        db.add_image(username.clone(), format!("https://aursenass2.herokuapp.com/img/{}",filename)).await.unwrap();
    }
    Ok(HttpResponse::Ok().into())
}

#[get("/ws/")]
async fn ws_index(r: HttpRequest, stream: web::Payload) -> Result<HttpResponse, Error> {
    ws::start(WebSession::default(), &r, stream)
}

#[get("/images")]
async fn images() -> Result<HttpResponse, Error> {
    let db = MongoClient::init().await.unwrap();
    let images = db.get_images().await.unwrap();

    Ok(HttpResponse::Ok().json(images))
}

#[get("saved")]
async fn saved() -> Result<NamedFile, Error>{
    Ok(NamedFile::open("public/images.html")?)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    std::env::set_var("RUST_LOG", "actix_web=info");
    env_logger::init();
    let port = std::env::var("PORT").unwrap_or("8080".to_string());

    HttpServer::new(|| {
        App::new()
            .wrap(Logger::default())
            .service(ws_index)
            .service(save_file)
            .service(images)
            .service(saved)
            .service(Files::new("/img/", "./img"))
            .service(Files::new("/", "./public").index_file("index.html"))
    })
    .bind(format!("0.0.0.0:{}", port))?
    .run()
    .await
}
