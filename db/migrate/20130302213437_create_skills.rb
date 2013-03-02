class CreateSkills < ActiveRecord::Migration
    def up
        create_table :skills do |t|
            t.string    :name
            t.text      :description
            t.text      :related
            t.string    :attr
            t.timestamps
        end

    end

    def down
        drop_table :skills
    end
end
