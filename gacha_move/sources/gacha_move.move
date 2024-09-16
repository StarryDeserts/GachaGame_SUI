/// Module: gacha_move
module gacha_move::gacha_move {
    use std::string::{String, utf8};
    use sui::package;
    use sui::display;
    use sui::table::{Self, Table};
    use sui::event;

    const MAX_SUPPLY: u64 = 15;

    const ENotEnoughSupply: u64 = 0;
    const EDontMintAgain: u64 = 1;

    public struct AdminCap has key {
        id: UID,
    }

    public struct GachaNFT has key, store {
        id: UID,
        nft_id: u64,
        name: String,
        image_url: String,
        creator: address,
        recipient: address,
    }


    public struct MintRecord has key {
        id: UID,
        image_url_record: Table<String, bool>,
    }

    public struct NFTMinted has copy, drop {
        object_id: ID,
        creator: address,
        name: String,
    }

    public struct GACHA_MOVE  has drop {}

    fun init(otw: GACHA_MOVE, ctx: &mut TxContext) {
        let keys = vector[
            utf8(b"name"),
            utf8(b"description"),
            utf8(b"image_url"),
            utf8(b"creator"),
        ];
        let values = vector[
            utf8(b"{name} #{nft_id}"),
            utf8(b"A NFT for Gacha"),
            utf8(b"{image_url}"),
            utf8(b"{creator}"),
        ];
        let mint_record = MintRecord {
            id: object::new(ctx),
            image_url_record: table::new<String, bool>(ctx),
        };

        let publisher = package::claim(otw, ctx);
        let mut display = display::new_with_fields<GachaNFT>(&publisher, keys, values, ctx);
        let admin = AdminCap {
            id: object::new(ctx),
        };
        display::update_version(&mut display);

        transfer::transfer(admin, ctx.sender());
        transfer::public_transfer(publisher, ctx.sender());
        transfer::public_transfer(display, ctx.sender());
        transfer::share_object(mint_record);
    }

    public entry fun mint(mint_record: &mut MintRecord, image_url: String, recipient: address, ctx: &mut TxContext) {
        assert!(!table::contains(&mint_record.image_url_record, image_url), EDontMintAgain);
        let nft_id: u64 = table::length(&mint_record.image_url_record) + 1;
        assert!(nft_id <= MAX_SUPPLY, ENotEnoughSupply);
        table::add(&mut mint_record.image_url_record, image_url, true);
        let nft = GachaNFT {
            id: object::new(ctx),
            nft_id,
            name: utf8(b"Gacha"),
            image_url,
            creator: ctx.sender(),
            recipient,
        };
        event::emit(NFTMinted {
            object_id: object::id(&nft),
            creator: ctx.sender(),
            name: nft.name,
        });
        transfer::public_transfer(nft, recipient);
    }
}
    // claim GACHA_TOKEN from the pool with counts adn random amount


