use chrono::prelude::*;
use mongodb::{bson::doc, error::Error, options::ClientOptions, Client, Collection};
use serde::{Deserialize, Serialize};
use futures::stream::StreamExt;

#[derive(Debug, Serialize, Deserialize)]
pub struct Image {
    pub username: String,
    pub date: String,
    pub path: String,
}

impl Image {
    fn new(username: String, path: String) -> Self {
        Image {
            username,
            date: Local::now().format("%d/%m/%Y %H:%M").to_string(),
            path,
        }
    }
}

#[derive(Debug)]
pub struct MongoClient {
    col: Collection,
}

impl MongoClient {
    pub async fn init() -> Result<Self, Error> {
        let client_uri =
            std::env::var("MONGODB").expect("You must set the MONGODB environment var!");
        let client_options = ClientOptions::parse(&client_uri).await?;
        let client = Client::with_options(client_options)?;
        let db = client.database("webapp");
        let col = db.collection("images");

        Ok(Self { col })
    }

    pub async fn add_image(self, user: String, path: String) -> Result<(), Error> {
        let img = Image::new(user, path);
        self.col.insert_one(mongodb::bson::to_document(&img)?, None).await?;

        Ok(())
    }

    pub async fn get_images(self) -> Result<Vec<Image>, Error> {
        let mut cursor = self.col.find(None, None).await?;
        let mut images = Vec::new();

        while let Some(result) = cursor.next().await {
            match result {
                Ok(document) => {
                    images.push(mongodb::bson::from_document::<Image>(document)?);
                }
                Err(e) => return Err(e.into()),
            }
        }

        Ok(images)
    }
}
