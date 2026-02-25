import { useEffect, useState } from "react";
import {
  MenuCategoryProps,
  MenuItemProps,
  useMenu,
} from "../utils/dashboardService";
import MenuItem from "../components/MenuItem";
import RefreshButton from "../components/RefreshButton";
import { v4 as uuidv4 } from "uuid";
import {
  MdAdd,
  MdArrowDownward,
  MdArrowUpward,
  MdCheck,
  MdClose,
  MdEdit,
} from "react-icons/md";

import { doc, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useQueryClient } from "@tanstack/react-query";
import { arrayMove } from "@dnd-kit/sortable";
import MenuItemEditing from "../components/MenuItemEditing";

export default function Menu() {
  const queryClient = useQueryClient();
  const { data: menu, isFetching } = useMenu();
  const [menuItems, setMenuItems] = useState<MenuItemProps[]>([]);
  const [categories, setCategories] = useState<MenuCategoryProps[]>([]);

  const [editing, setEditing] = useState<boolean>(false);
  const [savingChanges, setSavingChanges] = useState<boolean>(false);
  const [disableSave, setDisableSave] = useState<boolean>(false);
  const [editedMenuItems, setEditedMenuItems] = useState<MenuItemProps[]>([]);
  const [editedCategories, setEditedCategories] = useState<MenuCategoryProps[]>(
    [],
  );

  function addCategory(title: string) {
    const newCategory: MenuCategoryProps = {
      id: uuidv4(),
      title: title,
      items: [],
    };
    setEditedCategories((prev) => [...prev, newCategory]);
  }
  function editCategory(id: string, data: Partial<MenuCategoryProps>) {
    setEditedCategories((prev) =>
      prev.map((category) =>
        category.id === id ? { ...category, ...data } : category,
      ),
    );
  }
  function moveCategory(id: string, direction: "up" | "down") {
    setEditedCategories((prev) => {
      const index = prev.findIndex((category) => category.id === id);
      if (index === -1) return prev;

      const newIndex =
        direction === "up"
          ? Math.max(0, index - 1)
          : Math.min(prev.length - 1, index + 1);
      if (newIndex === index) return prev;

      return arrayMove(prev, index, newIndex);
    });
  }
  function removeCategory(id: string) {
    // Use the *current* editedCategories state to determine which items belong to this category.
    const category = editedCategories.find((cat) => cat.id === id);
    const itemIdsToRemove = category?.items ?? [];

    // Remove the items that were in the deleted category
    if (itemIdsToRemove.length > 0) {
      setEditedMenuItems((prev) =>
        prev.filter((item) => !itemIdsToRemove.includes(item.id)),
      );
    }

    // Remove the category itself and also scrub any references to removed items from other categories
    setEditedCategories((prev) =>
      prev
        .filter((cat) => cat.id !== id)
        .map((cat) => ({
          ...cat,
          items: itemIdsToRemove.length
            ? cat.items.filter((itemId) => !itemIdsToRemove.includes(itemId))
            : cat.items,
        })),
    );
  }
  function addItem(categoryId: string, item: MenuItemProps) {
    setEditedMenuItems((prev) => {
      // Prevent accidental duplicates by id
      if (prev.some((it) => it.id === item.id)) return prev;
      return [...prev, item];
    });

    setEditedCategories((prev) =>
      prev.map((category) => {
        if (category.id !== categoryId) return category;
        if (category.items.includes(item.id)) return category;
        return { ...category, items: [...category.items, item.id] };
      }),
    );
  }
  function editItem(itemId: string, data: Partial<MenuItemProps>) {
    setEditedMenuItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...data } : item)),
    );
  }
  function moveItem(
    categoryId: string,
    itemId: string,
    direction: "up" | "down",
  ) {
    setEditedCategories((prev) =>
      prev.map((category) => {
        if (category.id !== categoryId) return category;

        const index = category.items.indexOf(itemId);
        if (index === -1) return category;

        const newIndex =
          direction === "up"
            ? Math.max(0, index - 1)
            : Math.min(category.items.length - 1, index + 1);
        if (newIndex === index) return category;

        return {
          ...category,
          items: arrayMove(category.items, index, newIndex),
        };
      }),
    );
  }
  function removeItem(itemId: string) {
    setEditedMenuItems((prev) => prev.filter((item) => item.id !== itemId));

    // Remove the itemId from any category that references it
    setEditedCategories((prev) =>
      prev.map((category) => ({
        ...category,
        items: category.items.filter((id) => id !== itemId),
      })),
    );
  }

  useEffect(() => {
    if (menu) {
      setMenuItems(menu.items);
      setCategories(menu.categories);
    }
  }, [menu]);

  useEffect(() => {
    if (editing) {
      setEditedMenuItems(menuItems);
      setEditedCategories(categories);
    }
  }, [editing]);

  const handleSaveChanges = async () => {
    try {
      setSavingChanges(true);
      await updateDoc(doc(db, "menu", "menuItems"), {
        items: editedMenuItems,
        categories: editedCategories,
        updatedAt: new Date(),
      });
      queryClient.setQueryData<{
        items: MenuItemProps[];
        categories: MenuCategoryProps[];
        updatedAt: Timestamp;
      }>(["menu"], () => ({
        items: editedMenuItems,
        categories: editedCategories,
        updatedAt: Timestamp.fromDate(new Date()),
      }));

      setMenuItems(editedMenuItems);
      setCategories(editedCategories);
      setEditing(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingChanges(false);
    }
  };

  return isFetching || !menu ? (
    <div className="w-screen h-screen flex justify-center items-center">
      <p>Loading...</p>
    </div>
  ) : (
    <div className="w-full flex flex-col gap-4 p-4 pt-20">
      <div className="w-full flex items-center justify-between pb-2 border-b border-b-gray-300 gap-4">
        <div className="flex gap-4">
          <h1 className="text-2xl font-semibold">
            {menuItems.length} Menu Items
          </h1>
          {editing ? (
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-1 px-3 py-1 border border-amber-500 hover:bg-amber-100 text-amber-500 font-semibold rounded-full cursor-pointer"
                onClick={() => addCategory("New Category")}
              >
                Add Category
                <MdAdd size={20} color="#d97706" />
              </button>
              <button
                className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-400 text-white font-semibold rounded-full cursor-pointer"
                disabled={disableSave}
                onClick={handleSaveChanges}
              >
                Save Changes
                <MdCheck size={20} />
              </button>
            </div>
          ) : (
            <button
              className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-full cursor-pointer"
              onClick={() => setEditing(true)}
            >
              Edit Menu
              <MdEdit size={20} />
            </button>
          )}
        </div>
        <RefreshButton queryKey="menu" />
      </div>
      <div className="w-full flex flex-col gap-4">
        {editing ? (
          savingChanges ? (
            <p>Saving changes...</p>
          ) : (
            editedCategories.map((category) => (
              <div key={category.id} className="flex flex-col">
                <div className="flex gap-2 border-b border-gray-300 p-1">
                  <input
                    type="text"
                    value={category.title}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      editCategory(category.id, { title: newTitle });
                    }}
                    className="text-xl font-bold border border-amber-500 p-1 rounded-lg"
                  />
                  <button
                    className="flex items-center gap-1 px-3 py-1 border border-amber-500 hover:bg-amber-100 text-amber-500 font-semibold rounded-full cursor-pointer"
                    onClick={() => {
                      addItem(category.id, {
                        id: uuidv4(),
                        name: "New Item",
                        price: 0,
                        outOfStock: false,
                      });
                    }}
                  >
                    Add Item
                    <MdAdd size={20} color="#d97706" />
                  </button>
                  <button
                    className={`flex items-center gap-1 px-2 py-1 border border-amber-500 hover:bg-amber-100 rounded-full cursor-pointer disabled:opacity-50`}
                    onClick={() => {
                      moveCategory(category.id, "up");
                    }}
                    disabled={editedCategories[0].id === category.id}
                  >
                    <MdArrowUpward size={20} color="#d97706" />
                  </button>
                  <button
                    className={`flex items-center gap-1 px-2 py-1 border border-amber-500 hover:bg-amber-100 rounded-full cursor-pointer disabled:opacity-50`}
                    onClick={() => {
                      moveCategory(category.id, "down");
                    }}
                    disabled={
                      editedCategories[editedCategories.length - 1].id ===
                      category.id
                    }
                  >
                    <MdArrowDownward size={20} color="#d97706" />
                  </button>
                  <button
                    className={`flex items-center gap-1 px-2 py-1 border border-red-500 hover:bg-red-100 rounded-full cursor-pointer`}
                    onClick={() => {
                      if (
                        !confirm(
                          "Are you sure you want to delete this category? All items in this category will also be deleted.",
                        )
                      )
                        return;
                      removeCategory(category.id);
                    }}
                  >
                    <MdClose size={20} color="red" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-4 p-2">
                  {(() => {
                    const itemById: Record<string, MenuItemProps> = {};
                    for (const it of editedMenuItems) itemById[it.id] = it;

                    return category.items
                      .map((id) => itemById[id])
                      .filter(Boolean)
                      .map((item) => (
                        <MenuItemEditing
                          key={item.id}
                          {...item}
                          categoryId={category.id}
                          editItem={editItem}
                          moveItem={moveItem}
                          removeItem={removeItem}
                          setDisableSave={setDisableSave}
                        />
                      ));
                  })()}
                </div>
              </div>
            ))
          )
        ) : (
          categories.map((category) => (
            <div key={category.id} className="flex flex-col">
              <div className="flex gap-2 border-b border-gray-300 p-1">
                <h1 className="text-xl font-bold">{category.title}</h1>
              </div>
              <div className="flex flex-wrap gap-4 p-2">
                {(() => {
                  const itemById: Record<string, MenuItemProps> = {};
                  for (const it of menuItems) itemById[it.id] = it;

                  return category.items
                    .map((id) => itemById[id])
                    .filter(Boolean)
                    .map((item) => <MenuItem key={item.id} {...item} />);
                })()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
